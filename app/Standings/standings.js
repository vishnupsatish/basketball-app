const view = require("tns-core-modules/ui/core/view");
const httpModule = require("tns-core-modules/http");
var drawer;

exports.toggleDrawer = function () {
    drawer.toggleDrawerState();
};
const imageModule = require("nativescript-image");

//do this before creating any image view
imageModule.initialize({ isDownsampleEnabled: true });


const connectivityModule = require("tns-core-modules/connectivity");
var FeedbackPlugin = require("nativescript-feedback");
exports.checkConnection = function(args) {
    const type = connectivityModule.getConnectionType();
    console.log(connectivityModule.connectionType.none)
    if (type === 0) {
        console.log("no internet")
        var feedback = new FeedbackPlugin.Feedback();
        feedback.show({
            type: FeedbackPlugin.FeedbackType.Error,
            title: "No Internet Connection",
            message: "Most features of this app will not work without Internet."
        })
    }
    connectivityModule.startMonitoring((newConnectionType) => {
        console.log(newConnectionType)
        if (newConnectionType === connectivityModule.connectionType.none) {
            var feedback = new FeedbackPlugin.Feedback();
            feedback.show({
                type: FeedbackPlugin.FeedbackType.Error,
                title: "No Internet Connection",
                message: "Most features of this app will not work without Internet."
            });
        }
    });
    connectivityModule.stopMonitoring();
}




exports.changePage = function (args) {
    const button = args.object;
    const page = button.page;
    console.log(args.object.where)
    const folder = args.object.where
    const file = args.object.where.toLowerCase();
    page.frame.navigate(folder+"/"+file);
};

    exports.specificTeam = function(args) {
        const page = args.object.page
        var team = args.object.team;
        var navigationEntry = {
            moduleName: "Team-Specific/team-specific",
            context: { info: team },
            animated: true,
            transition: {
                name: "fade",
                duration: 380,
                //curve: "easeIn"
            }
        };
        if (team != "Not team") {
            page.frame.navigate(navigationEntry);
        }
        /*const page = args.object.page
        page.frame.navigate("Team-Specific/team-specific")*/
    };



exports.pageLoaded = function (args) {
    var eastitems = [];
    var westitems = [];
    const page = args.object;
    drawer = view.getViewById(page, "sideDrawer");

    httpModule.request({
        url: "https://data.nba.net/prod//v1/current/standings_conference.json",
        method: "GET"
    }).then((response) => {
        var standings = JSON.parse(response.content.toString())
        eastitems.push(
            {
                teamName: "Team",
                win: "W",
                loss: "L",
                pct: "Pct",
                gb: "GB",
                strk: "Strk",
                id: "Not team"
            })
        for (var i = 0; i < standings.league.standard.conference.east.length; i++) {
            currentTeam = standings.league.standard.conference.east[i]
            var team_name = currentTeam.teamSitesOnly.teamName + " " + currentTeam.teamSitesOnly.teamNickname
            eastitems.push(
                {
                    pos: i + 1,
                    teamLogo: "https://alleyoop.sirv.com/" + team_name + ".png",
                    teamName: currentTeam.teamSitesOnly.teamNickname,
                    win: currentTeam.win,
                    loss: currentTeam.loss,
                    pct: currentTeam.winPct,
                    gb: currentTeam.gamesBehind,
                    strk: currentTeam.isWinStreak ? "W" + currentTeam.streak : "L" + currentTeam.streak,
                    id: currentTeam.teamSitesOnly.teamCode
                })
        }
        westitems.push(
            {
                teamName: "Team",
                win: "W",
                loss: "L",
                pct: "Pct",
                gb: "GB",
                strk: "Strk",
                id: "Not team"
            })
        for (var i = 0; i < standings.league.standard.conference.west.length; i++) {
            currentTeam = standings.league.standard.conference.west[i]
            var team_name = currentTeam.teamSitesOnly.teamName + " " + currentTeam.teamSitesOnly.teamNickname
            westitems.push(
                {
                    pos: i + 1,
                    teamLogo: "https://alleyoop.sirv.com/" + team_name + ".png",
                    teamName: currentTeam.teamSitesOnly.teamNickname,
                    win: currentTeam.win,
                    loss: currentTeam.loss,
                    pct: currentTeam.winPct,
                    gb: currentTeam.gamesBehind,
                    strk: currentTeam.isWinStreak ? "W" + currentTeam.streak : "L" + currentTeam.streak,
                    id: currentTeam.teamSitesOnly.teamCode
                })
        }

        var listvieweast = view.getViewById(page, "listvieweast");
        listvieweast.items = eastitems;
        var listviewwest = view.getViewById(page, "listviewwest");
        listviewwest.items = westitems;


    }, (e) => {
    });

}
