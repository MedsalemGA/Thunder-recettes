import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.thunder.express.tn',
  appName: 'thunder-express',
  webDir: 'www',
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      loadUrlTimeoutValue: '200000',
      Fullscreen: 'true',
      'cordova.plugins.diagnostic.modules': 'LOCATION',
      AndroidPersistentFileLocation: 'Compatibility',
      allowFileAccessFromFileURLs: 'true',
      allowUniversalAccessFromFileURLs: 'true',
      hostname: 'localhost',
      'deployment-target': '14.0',
    }
  },
  plugins: {
    
    CapacitorHttp: {
      enabled: false
    },
    SocialLogin: {
      providers: {
        google: {
          iOSClientId: "168001157759-cqqlm9ujlu6126gbqmb2k0o48hcf85c8.apps.googleusercontent.com",
          webClientId: "168001157759-i6vl643mh8tfjrvtkev648pelbe41hsf.apps.googleusercontent.com",
          serverClientId: "168001157759-i6vl643mh8tfjrvtkev648pelbe41hsf.apps.googleusercontent.com",
          shouldRequestIdToken: true,
          scopes: ["profile", "email", "openid"],
          forceCodeForRefreshToken: true,
          signInOption: "prompt",
          grantOfflineAccess: true
        }
      }
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff", // white
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: false,
      splashImmersive: false
    },
    Network: {
      enabled: true
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    Storage: {
      enabled: true,
      driverOrder: ['sqlite', 'indexeddb', 'websql', 'localstorage']
    },
    Filesystem: {
      directory: 'cache'
    },
  },
  ios: {
    scheme: 'thunder-express',
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: true,
    limitsNavigationsToAppBoundDomains: false
  },
  server: {
    hostname: "localhost",
    androidScheme: "http",
    allowNavigation: [
      "*.thunder-express.com",
      "*.googleusercontent.com",
      "*.google.com",
      "com.googleusercontent.apps.168001157759-cqqlm9ujlu6126gbqmb2k0o48hcf85c8://*"
    ],
    cleartext: true
  },
};

export default config;
