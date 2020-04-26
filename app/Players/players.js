const view = require("tns-core-modules/ui/core/view");
const httpModule = require("tns-core-modules/http");
const colours = require("../JSON/colour.js").colours;
const appSettings = require("tns-core-modules/application-settings");



const connectivityModule = require("tns-core-modules/connectivity");
var FeedbackPlugin = require("nativescript-feedback");
exports.checkConnection = function(args) {
    const page = args.object
    const button = view.getViewById(page, "teamFilterButton")
    const yearButton = page.getViewById("yearFilterButton")
    for (var j = 0; j < colours.length; j++) {
        if (toOpenSpecific.team == colours[j].name) {
            button.backgroundColor = "rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")"
            button.color = "white"
            button.text = toOpenSpecific.team
        }
        else if (toOpenSpecific.team == "Philadelphia 76ers") {
            button.backgroundColor = "rgb(237, 23, 76)"
            button.color = "white"
            button.text = toOpenSpecific.team
        }
        else if (toOpenSpecific.team === "None") {
            button.backgroundColor = "#C9082A"
            button.color = "white"
            button.text = "Filter by team... (optional)"
        }
    }
    yearButton.text = toOpenSpecific.year != "Only active" ? toOpenSpecific.year : "Filter by year... (optional)"


    appSettings.setString("playerSearchScroll", "0");
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


var toOpenSpecific = { team: "None", player: "", year: "Only active" }
var drawer;


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



exports.configListPick = function (args) {
    const page = args.object
    drawer = view.getViewById(page, "sideDrawer");
    //page.getViewById("whichYears").items = ["Only active", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012"]
    var teamItems = []
    httpModule.request({
        url: "https://www.balldontlie.io/api/v1/teams",
        method: "GET"
    }).then((response) => {
        var teams = JSON.parse(response.content.toString()).data
        teamItems.push({ title: "None" })
        for (var i = 0; i < teams.length; i++) {
            teamItems.push(
                {
                    title: teams[i].full_name,
                    image: "https://alleyoop.sirv.com/" + teams[i].full_name + ".png",
                })
        }
        var pickerItems = page.getViewById("teamFilter");
        pickerItems.source = teamItems

    }, (e) => {
    });


}




function openYearPicker(args) {
    const page = args.object.page
    page.getViewById('teamFilter').source = ["Only active", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012"]
    page.getViewById('teamFilter').show();
}

exports.openYearPicker = openYearPicker





function openTeamPicker(args) {
    const page = args.object.page
    var teamItems = []
    httpModule.request({
        url: "https://www.balldontlie.io/api/v1/teams",
        method: "GET"
    }).then((response) => {
        var teams = JSON.parse(response.content.toString()).data
        teamItems.push({ title: "None" })
        for (var i = 0; i < teams.length; i++) {
            teamItems.push(
                {
                    title: teams[i].full_name,
                    image: "https://alleyoop.sirv.com/" + teams[i].full_name + ".png",
                })
        }
        var pickerItems = page.getViewById("teamFilter");
        pickerItems.source = teamItems

    }, (e) => {
    });
    page.getViewById('teamFilter').show();
}

function teamSelected(args) {
    const page = args.object.page
    selectedItem = args.selectedItem
    var button;

    if (selectedItem.constructor != Object) {
        button = view.getViewById(page, "yearFilterButton")
        toOpenSpecific.year = selectedItem
    }
    else {
        selectedItem = args.selectedItem.title

        button = view.getViewById(page, "teamFilterButton")
        for (var j = 0; j < colours.length; j++) {
            if (selectedItem == colours[j].name) {
                button.backgroundColor = "rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")"
                button.color = "white"
            }
            else if (selectedItem == "Philadelphia 76ers") {
                button.backgroundColor = "rgb(237, 23, 76)"
                button.color = "white"
            }
            else if (selectedItem === "None") {
                button.backgroundColor = "#C9082A"
                button.color = "white"
            }
        }
        toOpenSpecific.team = selectedItem
    }
    button.text = selectedItem

}




exports.teamSelected = teamSelected


exports.openTeamPicker = openTeamPicker




function goToPlayerSearch(args) {
    const page = args.object.page
    search = page.getViewById("playerBar").text

        toOpenSpecific.player = search
        var navigationEntry = {
            moduleName: "Player-Search/player-search",
            context: { info: toOpenSpecific },
            animated: true,
            transition: {
                name: "slideLeft",
                duration: 380,
                curve: "easeIn"
            }
        };
        page.frame.navigate(navigationEntry);
}


exports.goToPlayerSearch = goToPlayerSearch



