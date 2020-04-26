const view = require("tns-core-modules/ui/core/view");
const httpModule = require("tns-core-modules/http");
var observableModule = require("data/observable");
const timerModule = require("tns-core-modules/timer");
var toGoPlayer = {name: "", id: "", year: ""}
const imageModule = require("nativescript-image");
imageModule.initialize({isDownsampleEnabled: true});
const colours = require("../JSON/colour.js").colours;
const Cache = require("tns-core-modules/ui/image-cache").Cache;


const connectivityModule = require("tns-core-modules/connectivity");
var FeedbackPlugin = require("nativescript-feedback");
exports.checkConnection = function (args) {
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

exports.goBack = function (args) {
    const button = args.object;
    const page = button.page;
    page.frame.goBack();
}
const fromNativeSource = require("tns-core-modules/image-source").ImageSource;

exports.specificTeam = function (args) {
    const page = args.object.page
    console.log(args.object.teamId)
    var team = args.object.teamId;
    var navigationEntry = {
        moduleName: "Team-Specific/team-specific",
        context: {info: team},
        animated: true,
        transition: {
            name: "fade",
            duration: 380,
            //curve: "easeIn"
        }
    };
    page.frame.navigate(navigationEntry);
}

function showGame(args) {
    const page = args.object
    gameId = page.navigationContext.info
    var yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday = yesterday.toISOString().slice(0, 10);
    var today = new Date().toISOString().slice(0, 10);
    var homeTeam = []
    var gameState = []
    var awayTeam = []
    var homeColour = []
    var awayScore = []
    var homeScore = []
    var stadium = []
    console.log(gameId)
    httpModule.request({
        url: "https://global.nba.com/stats2/game/snapshot.json?gameId=" + gameId,
        method: "GET"
    }).then((response) => {
        var game = JSON.parse(response.content.toString()).payload
        var home = game.homeTeam.profile.city + " " + game.homeTeam.profile.name
        var visitor = game.awayTeam.profile.city + " " + game.awayTeam.profile.name
        var homeShort = game.homeTeam.profile.name
        var awayShort = game.awayTeam.profile.name
        toGoPlayer.year = game.season.year
        homeTeam.push("https://alleyoop.sirv.com/" + home + ".png")
        awayTeam.push("https://alleyoop.sirv.com/" + visitor + ".png")
        stadium.push(game.gameProfile.arenaName != null ? game.gameProfile.arenaName + "\n" + game.gameProfile.arenaLocation : game.gameProfile.arenaLocation)

        if (game.boxscore.status == 1) {
            gameState.push(game.boxscore.statusDesc)
            homeScore.push(0)
            awayScore.push(0)
        } else if (game.boxscore.status == 3) {
            gameState.push(game.boxscore.statusDesc)
            homeScore.push(game.boxscore.homeScore)
            awayScore.push(game.boxscore.awayScore)
        } else {
            gameState.push(game.boxscore.statusDesc)
            homeScore.push(game.boxscore.homeScore)
            awayScore.push(game.boxscore.awayScore)
        }

        for (var j = 0; j < colours.length; j++) {
            if (home == colours[j].name || home == colours[j].altName) {
                homeColour.push("rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")")
            }
        }


        const viewModel = observableModule.fromObject({
            homeName: homeShort,
            awayName: awayShort,
            homeTeam: homeTeam[0],
            awayTeam: awayTeam[0],
            gameState: gameState[0],
            homeColour: homeColour[0],
            awayScore: awayScore[0],
            homeScore: homeScore[0],
            stadium: stadium[0],
            showLabel: game.boxscore.status == 1 ? "visible" : "collapse",
            homeId: game.homeTeam.profile.code,
            awayId: game.awayTeam.profile.code
        });

        page.bindingContext = viewModel

        listShown = game.boxscore.status != 1 ? "visible" : "collapse"


        if (game.boxscore.status != 1) {
            const statNames = [
                "Quarter 1",
                "Quarter 2",
                "Quarter 3",
                "Quarter 4",
                "Field Goal %",
                "Field Goals",
                "Three Point %",
                "Three Pointers",
                "Free Throw %",
                "Free Throws",
                "Turnovers",
                "Blocks",
                "Fouls",
                "Assists",
                "Biggest Lead",
                "Rebounds",
                "Steals"
            ]

            const statJSON = [
                "q1Score",
                "q2Score",
                "q3Score",
                "q4Score",
                "fgpct",
                ["fgm","fga"],
                "tppct",
                ["tpm","tpa"],
                "ftpct",
                ["ftm","fta"],
                "turnovers",
                "blocks",
                "fouls",
                "assists",
                "biggestLead",
                "rebs",
                "steals"
            ]

            for (var i = 1; i < 11; i++) {
                console.log(game["homeTeam"]["score"]["ot" + i + "Score"])
                if (game["homeTeam"]["score"]["ot" + i + "Score"] != 0) {
                    statNames.splice(i + 3, 0, "Overtime " + i);
                    statJSON.splice(i + 3, 0, "ot" + i + "Score");
                }
                else {
                    break
                }
            }


            var allStats = []

            for (var i = 0; i < statNames.length; i++) {
                if (Array.isArray(statJSON[i])) {
                    allStats.push({
                        stat: statNames[i],
                        homeValue: String(game["homeTeam"]["score"][statJSON[i][0]]) + "/" +  String(game["homeTeam"]["score"][statJSON[i][1]]),
                        awayValue: String(game["awayTeam"]["score"][statJSON[i][0]]) + "/" + String(game["awayTeam"]["score"][statJSON[i][1]]),

                    })
                }
                else {
                    allStats.push({
                        stat: statNames[i],
                        homeValue: game["homeTeam"]["score"][statJSON[i]],
                        awayValue: game["awayTeam"]["score"][statJSON[i]],
                    })
                }
            }

            page.getViewById("allStats").items = allStats

            homePlayers = []

            homePlayers.push(
                {
                    pos: "pos",
                    name: "Player",
                    min: "min",
                    pts: "pts",
                    ast: "ast",
                    reb: "reb",
                    showList: listShown

                })

            for (var i = 0; i < game.homeTeam.gamePlayers.length; i++) {
                currentPlayer = game.homeTeam.gamePlayers[i]
                homePlayers.push(
                    {
                        pos: currentPlayer.profile.position,
                        img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png",
                        name: currentPlayer.profile.lastName,
                        min: currentPlayer.statTotal.mins,
                        pts: currentPlayer.statTotal.points,
                        ast: currentPlayer.statTotal.assists,
                        reb: currentPlayer.statTotal.rebs,
                        id: currentPlayer.profile.playerId,
                        fullName: currentPlayer.profile.displayName,
                        openPlayer: openPlayer,
                        //showList: listShown
                    })
            }

            var homePlay = view.getViewById(page, "homeStats");
            homePlay.items = homePlayers;


            awayPlayers = []

            awayPlayers.push(
                {
                    pos: "pos",
                    name: "Player",
                    min: "min",
                    pts: "pts",
                    ast: "ast",
                    reb: "reb",
                    //showList: listShown

                })


            for (var i = 0; i < game.awayTeam.gamePlayers.length; i++) {
                currentPlayer = game.awayTeam.gamePlayers[i]
                awayPlayers.push(
                    {
                        pos: currentPlayer.profile.position,
                        img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png",
                        name: currentPlayer.profile.lastName,
                        min: currentPlayer.statTotal.mins,
                        pts: currentPlayer.statTotal.points,
                        ast: currentPlayer.statTotal.assists,
                        reb: currentPlayer.statTotal.rebs,
                        id: currentPlayer.profile.playerId,
                        fullName: currentPlayer.profile.displayName,
                        openPlayer: openPlayer,
                        //showList: listShown
                    })
            }


            var awayPlay = view.getViewById(page, "awayStats");
            awayPlay.items = awayPlayers;

        }


    }, (e) => {
    });


    id = timerModule.setInterval(() => {


        httpModule.request({
            url: "https://global.nba.com/stats2/game/snapshot.json?gameId=" + gameId,
            method: "GET"
        }).then((response) => {
            var game = JSON.parse(response.content.toString()).payload
            var home = game.homeTeam.profile.city + " " + game.homeTeam.profile.name
            var visitor = game.awayTeam.profile.city + " " + game.awayTeam.profile.name
            var homeShort = game.homeTeam.profile.name
            var awayShort = game.awayTeam.profile.name
            if (game.boxscore.status == 1) {
                gameState.push(game.boxscore.statusDesc)
                homeScore.push(0)
                awayScore.push(0)
            } else if (game.boxscore.status == 3) {
                gameState.push(game.boxscore.statusDesc)
                homeScore.push(game.boxscore.homeScore)
                awayScore.push(game.boxscore.awayScore)
            } else {
                gameState.push(game.boxscore.statusDesc)
                homeScore.push(game.boxscore.homeScore)
                awayScore.push(game.boxscore.awayScore)
            }

            if (game.boxscore.status == 2) {
                homeTeam.push("https://alleyoop.sirv.com/" + home + ".png")
                awayTeam.push("https://alleyoop.sirv.com/" + visitor + ".png")
                stadium.push(game.gameProfile.arenaName + "\n" + game.gameProfile.arenaLocation)

                const statNames = [
                    "Quarter 1",
                    "Quarter 2",
                    "Quarter 3",
                    "Quarter 4",
                    "Field Goal %",
                    "Field Goals",
                    "Three Point %",
                    "Three Pointers",
                    "Free Throw %",
                    "Free Throws",
                    "Turnovers",
                    "Blocks",
                    "Fouls",
                    "Assists",
                    "Biggest Lead",
                    "Rebounds",
                    "Steals"
                ]

                const statJSON = [
                    "q1Score",
                    "q2Score",
                    "q3Score",
                    "q4Score",
                    "fgpct",
                    ["fgm","fga"],
                    "tppct",
                    ["tpm","tpa"],
                    "ftpct",
                    ["ftm","fta"],
                    "turnovers",
                    "blocks",
                    "fouls",
                    "assists",
                    "biggestLead",
                    "rebs",
                    "steals"
                ]

                for (var i = 1; i < 11; i++) {
                    console.log(game["homeTeam"]["score"]["ot" + i + "Score"])
                    if (game["homeTeam"]["score"]["ot" + i + "Score"] != 0) {
                        statNames.splice(i + 3, 0, "Overtime " + i);
                        statJSON.splice(i + 3, 0, "ot" + i + "Score");
                    }
                    else {
                        break
                    }
                }


                var allStats = []

                for (var i = 0; i < statNames.length; i++) {
                    if (Array.isArray(statJSON[i])) {
                        allStats.push({
                            stat: statNames[i],
                            homeValue: String(game["homeTeam"]["score"][statJSON[i][0]]) + "/" +  String(game["homeTeam"]["score"][statJSON[i][1]]),
                            awayValue: String(game["awayTeam"]["score"][statJSON[i][0]]) + "/" + String(game["awayTeam"]["score"][statJSON[i][1]]),

                        })
                    }
                    else {
                        allStats.push({
                            stat: statNames[i],
                            homeValue: game["homeTeam"]["score"][statJSON[i]],
                            awayValue: game["awayTeam"]["score"][statJSON[i]],
                        })
                    }
                }

                page.getViewById("allStats").items = allStats

                for (var j = 0; j < colours.length; j++) {
                    if (home == colours[j].name || home == colours[j].altName) {
                        homeColour.push("rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")")
                    }
                }
                const viewModel = observableModule.fromObject({
                    homeName: homeShort,
                    awayName: awayShort,
                    homeTeam: homeTeam[0],
                    awayTeam: awayTeam[0],
                    gameState: gameState[0],
                    homeColour: homeColour[0],
                    awayScore: awayScore[0],
                    homeScore: homeScore[0],
                    stadium: stadium[0],
                    showLabel: game.boxscore.status == 1 ? "visible" : "collapse",
                    homeId: game.homeTeam.profile.code,
                    awayId: game.awayTeam.profile.code

                });


                page.bindingContext = viewModel

                listShown = game.boxscore.status != 1 ? "visible" : "collapse"


                homePlayers = []

                homePlayers.push(
                    {
                        pos: "pos",
                        name: "Player",
                        min: "min",
                        pts: "pts",
                        ast: "ast",
                        reb: "reb",
                        showList: listShown
                    })

                for (var i = 0; i < game.homeTeam.gamePlayers.length; i++) {
                    currentPlayer = game.homeTeam.gamePlayers[i]
                    homePlayers.push(
                        {
                            pos: currentPlayer.profile.position,
                            img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png",
                            name: currentPlayer.profile.lastName,
                            min: currentPlayer.statTotal.mins,
                            pts: currentPlayer.statTotal.points,
                            ast: currentPlayer.statTotal.assists,
                            reb: currentPlayer.statTotal.rebs,
                            id: currentPlayer.profile.playerId,
                            fullName: currentPlayer.profile.displayName,
                            openPlayer: openPlayer,
                            //showList: listShown
                        })
                }
                awayPlayers = []

                awayPlayers.push(
                    {
                        pos: "pos",
                        name: "Player",
                        min: "min",
                        pts: "pts",
                        ast: "ast",
                        reb: "reb",
                        //showList: listShown
                    })


                var awayPlay = view.getViewById(page, "awayStats");
                awayPlay.items = awayPlayers;

                for (var i = 0; i < game.awayTeam.gamePlayers.length; i++) {
                    currentPlayer = game.awayTeam.gamePlayers[i]
                    awayPlayers.push(
                        {
                            pos: currentPlayer.profile.position,
                            img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png",
                            name: currentPlayer.profile.lastName,
                            min: currentPlayer.statTotal.mins,
                            pts: currentPlayer.statTotal.points,
                            ast: currentPlayer.statTotal.assists,
                            reb: currentPlayer.statTotal.rebs,
                            id: currentPlayer.profile.playerId,
                            fullName: currentPlayer.profile.displayName,
                            openPlayer: openPlayer,
                            //showList: listShown
                        })
                }


                var homePlay = view.getViewById(page, "homeStats");
                homePlay.items = homePlayers;

                var awayPlay = view.getViewById(page, "awayStats");
                awayPlay.items = awayPlayers;
            }


        }, (e) => {
        });

    }, 5000);


}

function openPlayer(args) {
    const page = args.object.page
    var name = args.object.name
    var id = args.object.player
    toGoPlayer.name = name
    toGoPlayer.id = id
    var navigationEntry = {
        moduleName: "Specific-Player/specific-player",
        context: {info: toGoPlayer},
        animated: true,
        transition: {
            name: "fade",
            duration: 380,
        }
    };
    page.frame.navigate(navigationEntry);
}

exports.openPlayer = openPlayer


exports.showGame = showGame

