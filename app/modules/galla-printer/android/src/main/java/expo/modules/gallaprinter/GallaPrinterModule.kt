package expo.modules.gallaprinter

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.IOException
import java.util.UUID

// Talks to small Bluetooth thermal receipt printers (classic Bluetooth, "serial port"
// profile). The app builds the ESC/POS bytes in JavaScript; this module only lists
// paired devices and sends bytes to one of them.
class GallaPrinterModule : Module() {
  private val sppUuid: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

  private fun adapter(): BluetoothAdapter? {
    val context = appContext.reactContext ?: return null
    val manager = context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    return manager?.adapter
  }

  @SuppressLint("MissingPermission")
  private fun openSocket(adapter: BluetoothAdapter, address: String): BluetoothSocket {
    val device = adapter.getRemoteDevice(address)
    try {
      adapter.cancelDiscovery()
    } catch (_: SecurityException) {
    }

    // 1. Standard secure serial connection.
    try {
      val s = device.createRfcommSocketToServiceRecord(sppUuid)
      s.connect()
      return s
    } catch (_: IOException) {
    }
    // 2. Insecure connection (many cheap printers need this).
    try {
      val s = device.createInsecureRfcommSocketToServiceRecord(sppUuid)
      s.connect()
      return s
    } catch (_: IOException) {
    }
    // 3. Last resort: channel 1 directly.
    val m = device.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
    val s = m.invoke(device, 1) as BluetoothSocket
    s.connect()
    return s
  }

  @SuppressLint("MissingPermission")
  private fun bonded(a: BluetoothAdapter): List<Map<String, String>> {
    val devices = a.bondedDevices ?: emptySet()
    return devices.map { d -> mapOf("name" to (d.name ?: ""), "address" to d.address) }
  }

  override fun definition() = ModuleDefinition {
    Name("GallaPrinter")

    Function("isEnabled") {
      return@Function adapter()?.isEnabled == true
    }

    // Paired (bonded) devices: [{ name, address }].
    Function("getPairedDevices") {
      val a = adapter() ?: return@Function emptyList<Map<String, String>>()
      try {
        return@Function bonded(a)
      } catch (_: SecurityException) {
        return@Function emptyList<Map<String, String>>()
      }
    }

    // Connect, send the bytes in small pieces, wait for the printer to finish, disconnect.
    AsyncFunction("print") { address: String, data: ByteArray, promise: Promise ->
      val a = adapter()
      if (a == null || !a.isEnabled) {
        promise.reject("BLUETOOTH_OFF", "Bluetooth is off", null)
        return@AsyncFunction
      }
      Thread {
        var socket: BluetoothSocket? = null
        try {
          socket = openSocket(a, address)
          val out = socket.outputStream
          var i = 0
          while (i < data.size) {
            val end = minOf(i + 256, data.size)
            out.write(data, i, end - i)
            out.flush()
            i = end
            Thread.sleep(20)
          }
          // Cheap printers drop the tail if we disconnect too quickly.
          Thread.sleep(400L + data.size / 8L)
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("PRINT_FAILED", e.message ?: "Could not print", e)
        } finally {
          try {
            socket?.close()
          } catch (_: IOException) {
          }
        }
      }.start()
    }
  }
}
