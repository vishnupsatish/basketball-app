
const view = require("tns-core-modules/ui/core/view");
const httpModule = require("tns-core-modules/http");
const colours = require("../JSON/colour.js").colours;
const Framea = require("tns-core-modules/ui/frame").Frame;
const ModalPicker = require("nativescript-modal-datetimepicker").ModalDatetimepicker;
const picker = new ModalPicker();
var dialogs = require("tns-core-modules/ui/dialogs");
const timerModule = require("tns-core-modules/timer");
var FeedbackPlugin = require("nativescript-feedback");


var archiveDate = ""

var observableModule = require("data/observable");
var observableArrayModule = require("data/observable-array");


const connectivityModule = require("tns-core-modules/connectivity");
var FeedbackPlugin = require("nativescript-feedback");
exports.checkConnection = function(args) {
    const type = connectivityModule.getConnectionType();
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
    const topmostFrame = Framea.topmost();
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


function showArchive(args) {
    var yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1);
    //yesterday = yesterday.toISOString().slice(0, 10);
    yesterday = formatDate(yesterday)

    var dayBefore = new Date()
    dayBefore.setDate(dayBefore.getDate() - 2);
    //dayBefore = dayBefore.toISOString().slice(0, 10);
    dayBefore = formatDate(dayBefore)
    const page = args.object
    drawer = view.getViewById(page, "sideDrawer");
    if (archiveDate == "") {
        picker.pickDate({
        title: "Select the NBA game date",
        theme: "light",
        startingDate: archiveDate != "" ? new Date(archiveDate) : new Date(dayBefore),
        maxDate: new Date(yesterday),
        minDate: new Date('2011-12-26'),
    })
        .then(result => {
            archiveDate = result.year + "-" + result.month + "-" + result.day

            var currentDate = page.getViewById("currentDate")
            currentDate.text = "Chosen date: " + archiveDate

            var homeTeams = []
            var gameStatuses = []
            var teamStatuses = []
            var awayTeams = []
            var colour = []
            var gameData = []


            httpModule.request({
                url: "https://global.nba.com/stats2/scores/daily.json?gameDate=" + archiveDate,
                method: "GET"
            }).then((response) => {
                var games = JSON.parse(response.content.toString())
                if (games.payload.date == null) {
                    var feedback = new FeedbackPlugin.Feedback();
                    feedback.show({
                        type: FeedbackPlugin.FeedbackType.Warning,
                        title: "Please choose a valid date",
                        message: "There were no NBA games on this date. Check if it is during the summer or in the offseason."
                    });
                } else {
                    for (var i = 0; i < games.payload.date.games.length; i++) {
                        currentGame = games.payload.date.games[i]
                        var home = currentGame.homeTeam.profile.city + " " + currentGame.homeTeam.profile.name
                        var visitor = currentGame.awayTeam.profile.city + " " + currentGame.awayTeam.profile.name
                        var homeShort = currentGame.homeTeam.profile.name
                        var awayShort = currentGame.awayTeam.profile.name
                        homeTeams.push("https://alleyoop.sirv.com/" + home + ".png")
                        awayTeams.push("https://alleyoop.sirv.com/" + visitor + ".png")
                        if (currentGame.boxscore.status === "1") {
                            gameStatuses.push("Did not play" + "\n" + currentGame.boxscore.statusDesc + "\n" + archiveDate)
                            teamStatuses.push(homeShort + " - " + awayShort)


                        } else if (currentGame.boxscore.status === "3") {
                            gameStatuses.push("Final" + "\n" + archiveDate)
                            teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
                        } else {
                            gameStatuses.push(archiveDate + "\n" + "Live")
                            teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
                        }
                        gameData.push(currentGame.profile.gameId)
                        for (var j = 0; j < colours.length; j++) {
                            if (home == colours[j].name || home == colours[j].altName) {
                                colour.push("rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")")
                            }
                        }


                    }
                }


                const page = args.object;


                const viewModel = observableModule.fromObject({
                    items: new observableArrayModule.ObservableArray([])
                });


                for (var j = 0; j < homeTeams.length; j++) {
                    viewModel.items.push({
                        homeTeam: homeTeams[j],
                        awayTeam: awayTeams[j],
                        gameStatus: gameStatuses[j],
                        teamStatus: teamStatuses[j],
                        colour: colour[j],
                        gameData: gameData[j]
                    })
                }


                page.bindingContext = viewModel
            })
        })
        .catch(error => {
            console.log("Error: " + error);


        });
}
};







function changeDate(args) {

    var yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1);
    //yesterday = yesterday.toISOString().slice(0, 10);
    yesterday = formatDate(yesterday)
    var dayBefore = new Date()
    dayBefore.setDate(dayBefore.getDate() - 2);
    //dayBefore = dayBefore.toISOString().slice(0, 10);
    dayBefore = formatDate(dayBefore)
    const page = args.object.page
    drawer = view.getViewById(page, "sideDrawer");
    console.log(new Date(archiveDate))
  picker.pickDate({
      title: "Select the NBA game date",
      theme: "light",
      maxDate: new Date(yesterday),
      minDate: new Date('2011-12-26'),
      startingDate: archiveDate != "" ? new Date(archiveDate) : new Date(dayBefore)
    })
    .then(result => {

        archiveDate = result.year + "-" + result.month + "-" + result.day

      var currentDate = page.getViewById("currentDate")
      currentDate.text = "Chosen date: " + archiveDate
      var homeTeams = []
    var gameStatuses = []
    var teamStatuses = []
    var awayTeams = []
    var colour = []
    var gameData = []


    httpModule.request({
        url: "https://global.nba.com/stats2/scores/daily.json?gameDate=" + archiveDate,
        method: "GET"
    }).then((response) => {
        var games = JSON.parse(response.content.toString())
        if (games.payload.date == null) {

            var feedback = new FeedbackPlugin.Feedback();
            feedback.show({
                type: FeedbackPlugin.FeedbackType.Warning,
                title: "Please choose a valid date",
                message: "There were no NBA games on this date. Check if it is during the summer or in the offseason."
            });
            /*dialogs.alert({
                title: "Choose a valid date",
                message: "There were no NBA games on this date. Check if it is during the summer or in the offseason.",
                okButtonText: "Okay"
            }).then(function () {
            });*/
        }
        else {

        for (var i = 0; i < games.payload.date.games.length; i++) {
            currentGame = games.payload.date.games[i]
            var home = currentGame.homeTeam.profile.city + " " + currentGame.homeTeam.profile.name
            var visitor = currentGame.awayTeam.profile.city + " " + currentGame.awayTeam.profile.name
            var homeShort = currentGame.homeTeam.profile.name
            var awayShort = currentGame.awayTeam.profile.name
            homeTeams.push("https://alleyoop.sirv.com/" + home + ".png")
            awayTeams.push("https://alleyoop.sirv.com/" + visitor + ".png")
            if (currentGame.boxscore.status === "1") {
                gameStatuses.push("Did not play" + "\n" + currentGame.boxscore.statusDesc + "\n" + archiveDate)
                teamStatuses.push(homeShort + " - " + awayShort)


            }
            else if (currentGame.boxscore.status === "3") {
                gameStatuses.push("Final" + "\n" + archiveDate)
                teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
            }
            else {
                gameStatuses.push(archiveDate + "\n" + "Live")
                teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
            }
            gameData.push(currentGame.profile.gameId)
            for (var j = 0; j < colours.length; j++) {
                if (home == colours[j].name || home == colours[j].altName) {
                    colour.push("rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")")
                }
            }


        }
    }



        const page = args.object.page;


        const viewModel = observableModule.fromObject({
            items: new observableArrayModule.ObservableArray([])
        });


        for (var j = 0; j < homeTeams.length; j++) {
            viewModel.items.push({ homeTeam: homeTeams[j], awayTeam: awayTeams[j], gameStatus: gameStatuses[j], teamStatus: teamStatuses[j], colour: colour[j], gameData: gameData[j] })
        }





        page.bindingContext = viewModel
    })
    })
    .catch(error => {


    });
};



exports.changeDate = changeDate






exports.showArchive = showArchive
