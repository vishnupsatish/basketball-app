const application = require("tns-core-modules/application");

const AppShortcuts = require("nativescript-app-shortcuts").AppShortcuts

// instantiate it and call setQuickActionCallback
new AppShortcuts().setQuickActionCallback(shortcutItem => {

    if (shortcutItem.type === "matches") {
        let frames = require("ui/frame");
        // on Android we need a little delay
        setTimeout(() => {
            frames.topmost().navigate("Home/home");
        });
    }
     else if (shortcutItem.type === "news") {
        let frames = require("ui/frame");
        // on Android we need a little delay
        setTimeout(() => {
            frames.topmost().navigate("News/news");
        });
    }
    else if (shortcutItem.type === "players") {
        let frames = require("ui/frame");
        // on Android we need a little delay
        setTimeout(() => {
            frames.topmost().navigate("Players/players");
        });
    }
    else if (shortcutItem.type === "standings") {
        let frames = require("ui/frame");
        // on Android we need a little delay
        setTimeout(() => {
            frames.topmost().navigate("Standings/standings");
        });
    }
});

application.run({ moduleName: "app-root" });


/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
