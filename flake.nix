# flake.nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  outputs = { self, nixpkgs }: {
    devShells.x86_64-linux.default = let
      pkgs = nixpkgs.legacyPackages.x86_64-linux;
      androidSdk = (pkgs.androidenv.composeAndroidPackages {
        platformVersions = [ "34" ];
        buildToolsVersions = [ "34.0.0" ];
        includeNDK = true;
      }).androidsdk;
    in pkgs.mkShell {
      buildInputs = [ androidSdk pkgs.jdk17 pkgs.nodejs ];
      ANDROID_HOME = "${androidSdk}/libexec/android-sdk";
      JAVA_HOME = "${pkgs.jdk17}";
    };
  };
}
