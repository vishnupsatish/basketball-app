const view = require("tns-core-modules/ui/core/view");
const httpModule = require("tns-core-modules/http");
var observableModule = require("data/observable");
var observableArrayModule = require("data/observable-array");
const colours = require("../JSON/colour.js").colours;
var dialogs = require("tns-core-modules/ui/dialogs");
const appSettings = require("tns-core-modules/application-settings");
var drawer;

exports.changePage = function (args) {
    const button = args.object;
    const page = button.page;
    console.log(args.object.where)
    const folder = args.object.where
    const file = args.object.where.toLowerCase();
    page.frame.navigate(folder+"/"+file);
};

const connectivityModule = require("tns-core-modules/connectivity");
var FeedbackPlugin = require("nativescript-feedback");
exports.checkConnection = function(args) {
    const page = args.object;
    drawer = view.getViewById(page, "sideDrawer");
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

function getTeams(args) {
    const page = args.object;
    httpModule.request({
        url: "https://ca.global.nba.com/stats2/league/conferenceteamlist.json?locale=en",
        method: "GET"
    }).then((response) => {
        var eastitems = [];
        var westitems = [];
        var teams = JSON.parse(response.content.toString()).payload.listGroups;
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 15; j++) {
                const currentTeam = teams[i].teams[j].profile
                const fullName = currentTeam.city + " " + currentTeam.name
                for (var k = 0; k < colours.length; k++) {
                    if (fullName == colours[k].name || fullName == colours[k].altName) {
                        var colour = "rgb(" + colours[k].colors.rgb[0].split(/[ ,]+/).join(',') + ")"
                        var currentR = Number(colours[k].colors.rgb[0].split(/[ ,]+/)[0])
                        var currentG = Number(colours[k].colors.rgb[0].split(/[ ,]+/)[1])
                        var currentB = Number(colours[k].colors.rgb[0].split(/[ ,]+/)[2])
                        var newR = currentR + (255 - currentR) * 0.4
                        var newG = currentG + (255 - currentG) * 0.4
                        var newB = currentB + (255 - currentB) * 0.4
                        var colour2 = "rgb("+newR+","+newG+","+newB+")"
                    }
                }
            if (i == 0) {
                eastitems.push(
                    {
                        name: fullName,
                        teamImage: "https://alleyoop.sirv.com/" + fullName + ".png",
                        backColour: colour,
                        imgColour: colour2,
                        id: currentTeam.code
                    })
            }
            else {
                westitems.push(
                    {
                        name: fullName,
                        teamImage: "https://alleyoop.sirv.com/" + fullName + ".png",
                        backColour: colour,
                        imgColour: colour2,
                        id: currentTeam.code
                    })
            }

            }
        }
        var east = view.getViewById(page, "eastView");
        east.items = eastitems;

        var west = view.getViewById(page, "westView");
        west.items = westitems;
    }, (e) => {
    });


}

exports.getTeams = getTeams;



exports.toggleDrawer = function () {
    drawer.toggleDrawerState();
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
    page.frame.navigate(navigationEntry);
    /*const page = args.object.page
    page.frame.navigate("Team-Specific/team-specific")*/
};
