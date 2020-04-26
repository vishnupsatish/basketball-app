const view = require("tns-core-modules/ui/core/view");
const httpModule = require("tns-core-modules/http");
const colours = require("../JSON/colour.js").colours;
const Frame = require("tns-core-modules/ui/frame").Frame;
const timerModule = require("tns-core-modules/timer");
const teams = require("../JSON/teams.js").teams;
const observableModule = require("tns-core-modules/data/observable");
const appSettings = require("tns-core-modules/application-settings");



const connectivityModule = require("tns-core-modules/connectivity");
var FeedbackPlugin = require("nativescript-feedback");
exports.checkConnection = function(args) {
    const type = connectivityModule.getConnectionType();
    if (type === 0) {
        var feedback = new FeedbackPlugin.Feedback();
        feedback.show({
            type: FeedbackPlugin.FeedbackType.Error,
            title: "No Internet Connection",
            message: "Most features of this app will not work without Internet."
        })
    }
    connectivityModule.startMonitoring((newConnectionType) => {
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

exports.goBack = function (args) {
    const button = args.object;
    const page = button.page;
    page.frame.goBack();
}

function specificPlayer(args) {
    const page = args.object.page
    const playerview = page.getViewById("listview")
    appSettings.setString("playerSearchScroll", String(playerview.getScrollOffset()));
    var game = args.object.player;
    var navigationEntry = {
        moduleName: "Specific-Player/specific-player",
        context: { info: game },
        animated: true,
        transition: {
            name: "fade",
            duration: 380,
        }
    };
    page.frame.navigate(navigationEntry);
}

exports.specificPlayer = specificPlayer

function getPlayers(args) {
    const page = args.object
    var items = [];
    var year = page.navigationContext.info.year
    var player = page.navigationContext.info.player
    var team = page.navigationContext.info.team
    var teamCity = page.navigationContext.info.team.split(" ")[page.navigationContext.info.team.split(" ").length-1]
    if (teamCity == "None") {
        teamCity = ""
    }


    httpModule.request({
        url: year === "Only active" ? "https://www.nba.com/players/active_players.json" : "https://data.nba.net/prod/v1/" + year + "/players.json",
        method: "GET"
    }).then((response) => {

        var players = JSON.parse(response.content.toString())
        if (year == "Only active") {
            for (var i = 0; i < players.length; i++) {
                fullName = players[i].firstName + " " + players[i].lastName
                if (fullName.toLowerCase().includes(player.toLowerCase()) && players[i].teamData.nickname.includes(teamCity)) {
                    var idAndName = {name: fullName, id: players[i].personId, year:"Only active", city:players[i].teamData.city, nickname:players[i].teamData.nickname}
                    for (var j = 0; j < colours.length; j++) {
                        if (colours[j].name.includes(players[i].teamData.city)) {
                            var colour = "rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")"
                            var currentR = Number(colours[j].colors.rgb[0].split(/[ ,]+/)[0])
                            var currentG = Number(colours[j].colors.rgb[0].split(/[ ,]+/)[1])
                            var currentB = Number(colours[j].colors.rgb[0].split(/[ ,]+/)[2])
                            var newR = currentR + (255 - currentR) * 0.4
                            var newG = currentG + (255 - currentG) * 0.4
                            var newB = currentB + (255 - currentB) * 0.4
                            var colour2 = "rgb("+newR+","+newG+","+newB+")"

                        }
                    }
                    //colour2 = "rgb(255,255,255)"
                    items.push(
                        {
                            playerName: players[i].firstName + " " + players[i].lastName,
                            playerTeam: players[i].teamData.city + " " + players[i].teamData.nickname,
                            teamImage: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + players[i].personId + ".png",
                            playerFull: players[i].personId,
                            backColour: colour,
                            imgColour: colour2,
                            idAndName: idAndName
                        })
                }
            }
        }
        else {
            players = players.league.standard
            for (var i = 0; i < players.length; i++) {
                if (players[i].teams.length === 0) {
                    var city = "Currently"
                    var nickname =  "inactive"
                }
                else {
                for (var j = 0; j < teams.length; j++) {

                    if (teams[j].profile.id == players[i].teams[players[i].teams.length - 1].teamId) {
                        var city = teams[j].profile.city
                        var shortCity = city.split(" ")[0]
                        var nickname =  teams[j].profile.name
                    }
                }
                }
                fullName = players[i].firstName + " " + players[i].lastName
                if (fullName.toLowerCase().includes(player.toLowerCase()) && nickname.includes(teamCity)) {
                    var idAndName = {name: fullName, id: players[i].personId, year: year, city:city, nickname:nickname}
                    for (var j = 0; j < colours.length; j++) {
                        if (colours[j].name.includes(shortCity)) {
                            var colour = "rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")"
                            var currentR = Number(colours[j].colors.rgb[0].split(/[ ,]+/)[0])
                            var currentG = Number(colours[j].colors.rgb[0].split(/[ ,]+/)[1])
                            var currentB = Number(colours[j].colors.rgb[0].split(/[ ,]+/)[2])
                            var newR = currentR + (255 - currentR) * 0.4
                            var newG = currentG + (255 - currentG) * 0.4
                            var newB = currentB + (255 - currentB) * 0.4
                            var colour2 = "rgb("+newR+","+newG+","+newB+")"
                        }
                    }
                    if (city == "Currently") {
                        var colour = "rgb(0, 0, 0)"
                        var colour2 = "rgb(180, 180, 180)"
                    }
                    items.push(
                        {
                            playerName: fullName,
                            playerTeam: city + " " + nickname,
                            teamImage: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + players[i].personId + ".png",
                            playerFull: players[i].personId,
                            backColour: colour,
                            imgColour: colour2,
                            idAndName: idAndName
                        })
                }
            }
        }
        if (items.length === 0) {
            var feedback = new FeedbackPlugin.Feedback();
            feedback.show({
                type: FeedbackPlugin.FeedbackType.Error,
                title: "No results",
                message: "No player results for your search query."
            })
        }
        if (items.length !== 0) {
            var listview = view.getViewById(page, "listview");
            listview.items = items;
        }

        var scrollAmount = Number(appSettings.getString("playerSearchScroll", "0"))
        if (scrollAmount !== 0) {
            const playerview = page.getViewById("listview")
            playerview.scrollWithAmount(scrollAmount, false)
        }


    }, (e) => {
    });

}

exports.getPlayers = getPlayers
