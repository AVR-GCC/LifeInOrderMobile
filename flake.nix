# flake.nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: {
    devShells.x86_64-linux.default = let
      pkgs = import nixpkgs {
        system = "x86_64-linux";
        config = {
          allowUnfree = true;
          android_sdk.accept_license = true;
        };
      };
      androidSdk = (pkgs.androidenv.composeAndroidPackages {
        platformVersions = [ "36" ];
        buildToolsVersions = [ "35.0.0" "36.0.0" ];
        includeNDK = true;
        ndkVersions = [ "27.1.12297006" ];
        cmakeVersions = [ "3.22.1" ];
      }).androidsdk;
    in pkgs.mkShell {
      buildInputs = [ androidSdk pkgs.jdk17 pkgs.nodejs pkgs.cmake ];
      ANDROID_HOME = "${androidSdk}/libexec/android-sdk";
      ANDROID_NDK_HOME = "${androidSdk}/libexec/android-sdk/ndk/27.1.12297006";
      JAVA_HOME = "${pkgs.jdk17}";
    };
  };
}
