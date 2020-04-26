const view = require("tns-core-modules/ui/core/view");
const httpModule = require("tns-core-modules/http");
const colours = require("../JSON/colour.js").colours;
const Frame = require("tns-core-modules/ui/frame").Frame;
const timerModule = require("tns-core-modules/timer");

const AppShortcuts = require("nativescript-app-shortcuts").AppShortcuts
const labelModule = require("tns-core-modules/ui/label");




var drawer;

const connectivityModule = require("tns-core-modules/connectivity");
const FeedbackPlugin = require("nativescript-feedback");
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


exports.toggleDrawer = function () {
    drawer.toggleDrawerState();
};


exports.changePage = function (args) {
    const button = args.object;
    const page = button.page;
    console.log(args.object.where)
    const folder = args.object.where
    const file = args.object.where.toLowerCase();
    page.frame.navigate(folder+"/"+file);
};

exports.goToGame = function (args) {
    const page = args.object.page
    var game = args.object.game;
    var navigationEntry = {
        moduleName: "Game/game",
        context: { info: game },
        animated: true,
        transition: {
            name: "slideLeft",
            duration: 380,
            curve: "easeIn"
        }
    };
    timerModule.setTimeout(() => {
        page.frame.navigate(navigationEntry);
    }, 100);


}






var observableModule = require("data/observable");
var observableArrayModule = require("data/observable-array")

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}



function onNavigatingTo(args) {
    let appShortcuts = new AppShortcuts();

    appShortcuts.configureQuickActions([
        {
            type: "matches",
            title: "Current Matches",
            iconTemplate: "basketball" // ignored by iOS, if iconType is set as well
        },
        {
            type: "news",
            title: "News",
            iconTemplate: "news"
        },
        {
            type: "players",
            title: "Player Search",
            iconTemplate: "player"
        },
        {
            type: "standings",
            title: "Standings",
            iconTemplate: "standings"
        }
    ]).then(() => {
    }, (errorMessage) => {
    });


    const page = args.object
    drawer = view.getViewById(page, "sideDrawer");

    var yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday = formatDate(yesterday)
    var today = formatDate(new Date())
    //yesterday = yesterday.toISOString().slice(0, 10);
    //var today = new Date().toISOString().slice(0, 10);
    var homeTeams = []
    var gameStatuses = []
    var teamStatuses = []
    var awayTeams = []
    var colour = []
    var gameData = []

    var viewModel = observableModule.fromObject({
        items: new observableArrayModule.ObservableArray([])
    });




    httpModule.request({
        url: "https://global.nba.com/stats2/scores/daily.json?gameDate=" + today,
        method: "GET"
    }).then((response) => {
        var games = JSON.parse(response.content.toString())
        if (games.payload.date == undefined) {
            page.getViewById("scroll").visibility = "collapse"
            var feedback = new FeedbackPlugin.Feedback();
            feedback.show({
                type: FeedbackPlugin.FeedbackType.Warning,
                title: "No games",
                message: "There are no NBA games on today's date, " + today
            })
        }

        for (var i = 0; i < games.payload.date.games.length; i++) {
            currentGame = games.payload.date.games[i]
            var home = currentGame.homeTeam.profile.city + " " + currentGame.homeTeam.profile.name
            var visitor = currentGame.awayTeam.profile.city + " " + currentGame.awayTeam.profile.name
            var homeShort = currentGame.homeTeam.profile.name
            var awayShort = currentGame.awayTeam.profile.name
            homeTeams.push("https://alleyoop.sirv.com/" + home + ".png")
            awayTeams.push("https://alleyoop.sirv.com/" + visitor + ".png")
            if (currentGame.boxscore.status === "1") {
                gameStatuses.push("Not started" + "\n" + currentGame.boxscore.statusDesc + "\n" + today)
                teamStatuses.push(homeShort + " - " + awayShort)

            }
            else if (currentGame.boxscore.status === "3") {
                gameStatuses.push("Final" + "\n" + today)
                teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
            }
            else {
                gameStatuses.push(today + "\n" + "Live")
                teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
            }
            gameData.push(currentGame.profile.gameId)
            for (var j = 0; j < colours.length; j++) {
                if (home == colours[j].name || home == colours[j].altName) {
                    colour.push("rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")")
                }
            }


        }

        httpModule.request({
            url: "https://global.nba.com/stats2/scores/daily.json?gameDate=" + yesterday,
            method: "GET"
        }).then((response) => {
            var games = JSON.parse(response.content.toString())
            for (var i = 0; i < games.payload.date.games.length; i++) {
                currentGame = games.payload.date.games[i]
                var home = currentGame.homeTeam.profile.city + " " + currentGame.homeTeam.profile.name
                var home_dashes = home.replace(/\s+/g, '-')
                var visitor = currentGame.awayTeam.profile.city + " " + currentGame.awayTeam.profile.name
                var visitor_dashes = visitor.replace(/\s+/g, '-')
                var homeShort = currentGame.homeTeam.profile.name
                var awayShort = currentGame.awayTeam.profile.name
                homeTeams.push("https://s5.gifyu.com/images/" + home_dashes + ".png")
                awayTeams.push("https://s5.gifyu.com/images/" + visitor_dashes + ".png")
                if (currentGame.boxscore.status === "1") {
                    gameStatuses.push("Not started" + "\n" + currentGame.boxscore.statusDesc + "\n" + yesterday)
                    teamStatuses.push(homeShort + " - " + awayShort)

                }
                else if (currentGame.boxscore.status === "3") {
                    gameStatuses.push("Final" + "\n" + yesterday)
                    teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
                }
                else {
                    gameStatuses.push(yesterday + "\n" + "Live")
                    teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
                }
                gameData.push(currentGame.profile.gameId)
                for (var j = 0; j < colours.length; j++) {
                    if (home == colours[j].name || home == colours[j].altName) {
                        colour.push("rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")")
                    }
                }




            }

            var page = args.object;




            /*for (var j = 0; j < homeTeams.length; j++) {
                viewModel.items.push({ homeTeam: homeTeams[j], awayTeam: awayTeams[j], gameStatus: gameStatuses[j], teamStatus: teamStatuses[j], colour: colour[j], gameData: gameData[j] })
            }


            page.bindingContext = viewModel*/

            var gameItes = []
            for (var j = 0; j < homeTeams.length; j++) {
                //viewModel.items.push({ homeTeam: homeTeams[j], awayTeam: awayTeams[j], gameStatus: gameStatuses[j], teamStatus: teamStatuses[j], colour: colour[j], gameData: gameData[j] })
                gameItes.push({ homeTeam: homeTeams[j], awayTeam: awayTeams[j], gameStatus: gameStatuses[j], teamStatus: teamStatuses[j], colour: colour[j], gameData: gameData[j] })
            }
            //page.getViewById("eachAndEvery").items = gameItes
            view.getViewById(page, "eachAndEvery").items = gameItes


        }, (e) => {

        });




    }, (e) => {


    });


}








function gameRefresh(args) {
    var isPullTo = false
    if (args.object.what === "pullto") {
        isPullTo = true
    }
    const page = args.object.page
    drawer = view.getViewById(page, "sideDrawer");

    var yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday = formatDate(yesterday)
    var today = formatDate(new Date())
    //yesterday = yesterday.toISOString().slice(0, 10);
    //var today = new Date().toISOString().slice(0, 10);
    var homeTeams = []
    var gameStatuses = []
    var teamStatuses = []
    var awayTeams = []
    var colour = []
    var gameData = []

    var viewModel = observableModule.fromObject({
        items: new observableArrayModule.ObservableArray([])
    });




    httpModule.request({
        url: "https://global.nba.com/stats2/scores/daily.json?gameDate=" + today,
        method: "GET"
    }).then((response) => {
        var games = JSON.parse(response.content.toString())


        for (var i = 0; i < games.payload.date.games.length; i++) {
            currentGame = games.payload.date.games[i]
            var home = currentGame.homeTeam.profile.city + " " + currentGame.homeTeam.profile.name
            var home_dashes = home.replace(/\s+/g, '-')
            var visitor = currentGame.awayTeam.profile.city + " " + currentGame.awayTeam.profile.name
            var visitor_dashes = visitor.replace(/\s+/g, '-')
            var homeShort = currentGame.homeTeam.profile.name
            var awayShort = currentGame.awayTeam.profile.name
            homeTeams.push("https://alleyoop.sirv.com/" + home + ".png")
            awayTeams.push("https://alleyoop.sirv.com/" + visitor + ".png")
            if (currentGame.boxscore.status === "1") {
                gameStatuses.push("Not started" + "\n" + currentGame.boxscore.statusDesc + "\n" + today)
                teamStatuses.push(homeShort + " - " + awayShort)

            }
            else if (currentGame.boxscore.status === "3") {
                gameStatuses.push("Final" + "\n" + today)
                teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
            }
            else {
                gameStatuses.push(today + "\n" + "Live")
                teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
            }
            gameData.push(currentGame.profile.gameId)
            for (var j = 0; j < colours.length; j++) {
                if (home == colours[j].name) {
                    colour.push("rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")")
                }
            }


        }

        httpModule.request({
            url: "https://global.nba.com/stats2/scores/daily.json?gameDate=" + yesterday,
            method: "GET"
        }).then((response) => {
            var games = JSON.parse(response.content.toString())
            for (var i = 0; i < games.payload.date.games.length; i++) {
                currentGame = games.payload.date.games[i]
                var home = currentGame.homeTeam.profile.city + " " + currentGame.homeTeam.profile.name
                var visitor = currentGame.awayTeam.profile.city + " " + currentGame.awayTeam.profile.name
                var homeShort = currentGame.homeTeam.profile.name
                var awayShort = currentGame.awayTeam.profile.name
                homeTeams.push("https://alleyoop.sirv.com/" + home + ".png")
                awayTeams.push("https://alleyoop.sirv.com/" + visitor + ".png")
                if (currentGame.boxscore.status === "1") {
                    gameStatuses.push("Not started" + "\n" + currentGame.boxscore.statusDesc + "\n" + yesterday)
                    teamStatuses.push(homeShort + " - " + awayShort)

                }
                else if (currentGame.boxscore.status === "3") {
                    gameStatuses.push("Final" + "\n" + yesterday)
                    teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
                }
                else {
                    gameStatuses.push(yesterday + "\n" + "Live")
                    teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
                }
                gameData.push(currentGame.profile.gameId)
                for (var j = 0; j < colours.length; j++) {
                    if (home == colours[j].name || home == colours[j].altName) {
                        colour.push("rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")")
                    }
                }




            }

            var page = args.object.page;



            var gameItes = []
            for (var j = 0; j < homeTeams.length; j++) {
                //viewModel.items.push({ homeTeam: homeTeams[j], awayTeam: awayTeams[j], gameStatus: gameStatuses[j], teamStatus: teamStatuses[j], colour: colour[j], gameData: gameData[j] })
                gameItes.push({ homeTeam: homeTeams[j], awayTeam: awayTeams[j], gameStatus: gameStatuses[j], teamStatus: teamStatuses[j], colour: colour[j], gameData: gameData[j] })
            }
            page.getViewById("eachAndEvery").items = gameItes


            //page.bindingContext = viewModel

            if (isPullTo) {
                timerModule.setTimeout(() => {
                    args.object.refreshing = false;
                }, 1000);
            }



        }, (e) => {

        });




    }, (e) => {


    });


}

function refreshList(args) {
    // Get reference to the PullToRefresh component;
    var pullRefresh = args.object;
    console.log(args.object)
    console.log(pullRefresh.what)
    // Do work here... and when done call set refreshing property to false to stop the refreshing
    /*loadItems().then(
        resp => {
            // ONLY USING A TIMEOUT TO SIMULATE/SHOW OFF THE REFRESHING
            setTimeout(() => {
                pullRefresh.refreshing = false;
            }, 1000);
        },
        err => {
            pullRefresh.refreshing = false;
        }
    );*/
}
exports.refreshList = refreshList;










exports.gameRefresh = gameRefresh;

exports.onNavigatingTo = onNavigatingTo;

