import { registerWebModule, NativeModule } from 'expo';

// GallaPrinterModule is not available on the web platform.
class GallaPrinterModule extends NativeModule<{}> {}

export default registerWebModule(GallaPrinterModule, 'GallaPrinterModule');
