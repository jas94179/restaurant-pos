import { NativeModule, requireNativeModule } from 'expo';

declare class GallaPrinterModule extends NativeModule<{}> {}

export default requireNativeModule<GallaPrinterModule>('GallaPrinter');
