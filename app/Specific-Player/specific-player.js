const view = require("tns-core-modules/ui/core/view");
const colours = require("../JSON/colour.js").colours;
const teams = require("../JSON/teams.js").teams;
const observableModule = require("tns-core-modules/data/observable");
const httpModule = require("tns-core-modules/http");
const imageModule = require("nativescript-image");
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
exports.goBack = function (args) {
    const button = args.object;
    const page = button.page;
    console.log(page.getViewById("specificPlayerImage"))
    page.getViewById("specificPlayerImage").animate({
        opacity: 0,
        duration: 250
    }).then(function() {
        page.frame.goBack();
    });
};

function getPlayerData(args) {
    const page = args.object
    var year = page.navigationContext.info.year
    var name = page.navigationContext.info.name
    var id = page.navigationContext.info.id
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    var newYear = currentYear;
    var latestFound = false
    var noStats = false
    console.log(id)
    async function getLatestYear() {
        while (!latestFound) {
            if (newYear != 2011) {
                await httpModule.request({
                    url: "https://data.nba.net/prod/v1/" + newYear + "/players/" + id + "_profile.json",
                    method: "GET"
                }).then((response) => {
                const status = response.statusCode;
                if (status != 200 || JSON.parse(response.content.toString()).league.standard.stats.latest.ppg == -1) {
                    newYear -= 1
                }
                else {
                    latestFound = true
                }
            }).catch((err) => {
                latestFound = true
            });
            }
            else {
                noStats = true
                return noStats
            }
        }

    };
    async function setStats() {
        await getLatestYear()
        if (!noStats) {
            httpModule.request({
                url: "https://data.nba.net/prod/v1/" + newYear + "/players/" + id + "_profile.json",
                method: "GET"
            }).then((response) => {
                var players = JSON.parse(response.content.toString())
                players = players.league.standard
                for (var j = 0; j < teams.length; j++) {
                    if (teams[j].profile.id == players.teamId) {
                        var latestCity = teams[j].profile.city
                        var latestNickname =  teams[j].profile.name
                        var latestTeam = latestCity + " " + latestNickname
                        var latestAbbr = teams[j].profile.abbr
                    }
                }
                for (var j = 0; j < colours.length; j++) {
                    if (colours[j].name.includes(latestCity)) {
                        var rgbTeam = "rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")"
                    }
                }
                const viewModel = observableModule.fromObject({
                    playerName: name,
                    playerTeam: latestTeam + " (latest team)",
                    playerImage: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + id + ".png",
                    teamColour: rgbTeam,
                });

                page.bindingContext = viewModel

                var playerAvg = []
                var playerTot = []
                playerAvg.push(
                    {
                        yr: "Year",
                        tm: "Team",
                        games: "G",
                        fgs: "FG%",
                        threep: "3P%",
                        ppg: "PPG",
                        apg: "APG",
                        bolded: "font-weight: 900;"
                    })
                playerTot.push(
                    {
                        yr: "Year",
                        tm: "Team",
                        games: "G",
                        fgs: "FGs",
                        threep: "3Ps",
                        ppg: "Pts",
                        bolded: "font-weight: 900;",
                        asis: "Ast.",
                        plus: "+-"
                    })
                for (var i = 0; i < players.stats.regularSeason.season.length; i++) {
                    currentSeason = players.stats.regularSeason.season[i]
                    if (currentSeason.teams.length > 1) {

                        for (var j = 0; j < currentSeason.teams.length; j++) {
                            for (var k = 0; k < teams.length; k++) {
                                if (teams[k].profile.id == currentSeason.teams[j].teamId) {
                                    var city = teams[k].profile.city
                                    var nickname =  teams[k].profile.name
                                    const team = city + " " + nickname
                                    var abbr = teams[k].profile.abbr
                                }
                            }
                            if (currentSeason.teams[j].teamId != 0) {
                                playerAvg.push(
                                    {
                                        yr: currentSeason.seasonYear,
                                        tm: abbr,
                                        games: currentSeason.teams[j].gamesPlayed,
                                        fgs: currentSeason.teams[j].fgp + "%",
                                        threep: currentSeason.teams[j].tpp + "%",
                                        ppg: currentSeason.teams[j].ppg,
                                        apg: currentSeason.teams[j].apg,
                                        bolded: "font-weight: 400;"
                                    })
                                playerTot.push(
                                    {
                                        yr: currentSeason.seasonYear,
                                        tm: abbr,
                                        games: currentSeason.teams[j].gamesPlayed,
                                        fgs: currentSeason.teams[j].fgm + "/" + currentSeason.teams[j].fga,
                                        threep: currentSeason.teams[j].tpm + "/" + currentSeason.teams[j].tpa,
                                        ppg: currentSeason.teams[j].points,
                                        asis: currentSeason.teams[j].assists,
                                        plus: currentSeason.teams[j].plusMinus,
                                        bolded: "font-weight: 400;"
                                    })
                            }
                        }
                    }
                    else {
                        for (var k = 0; k < teams.length; k++) {
                            if (teams[k].profile.id == currentSeason.teams[0].teamId) {
                                var city = teams[k].profile.city
                                var nickname =  teams[k].profile.name
                                const team = city + " " + nickname
                                var abbr = teams[k].profile.abbr
                            }
                        }
                        playerAvg.push(
                            {
                                yr: currentSeason.seasonYear,
                                tm: abbr,
                                games: currentSeason.teams[0].gamesPlayed,
                                fgs: currentSeason.teams[0].fgp + "%",
                                threep: currentSeason.teams[0].tpp + "%",
                                ppg: currentSeason.teams[0].ppg,
                                apg: currentSeason.teams[0].apg,
                                bolded: "font-weight: 400;"
                            })
                        playerTot.push(
                            {
                                yr: currentSeason.seasonYear,
                                tm: abbr,
                                games: currentSeason.teams[0].gamesPlayed,
                                fgs: currentSeason.teams[0].fgm + "/" + currentSeason.teams[0].fga,
                                threep: currentSeason.teams[0].tpm + "/" + currentSeason.teams[0].tpa,
                                ppg: currentSeason.teams[0].points,
                                asis: currentSeason.teams[0].assists,
                                plus: currentSeason.teams[0].plusMinus,
                                bolded: "font-weight: 400;"
                            })
                    }

                }
                playerAvg.push(
                    {
                        yr: "Tot.",
                        tm: "Tot.",
                        games: players.stats.careerSummary.gamesPlayed,
                        fgs: players.stats.careerSummary.fgp + "%",
                        threep: players.stats.careerSummary.tpp + "%",
                        ppg: players.stats.careerSummary.ppg,
                        apg: players.stats.careerSummary.apg,
                        bolded: "font-weight: 900;"
                    })
                playerTot.push(
                    {
                        yr: "Tot.",
                        tm: "Tot.",
                        games: players.stats.careerSummary.gamesPlayed,
                        fgs: players.stats.careerSummary.fgm + "/" + players.stats.careerSummary.fga,
                        threep: players.stats.careerSummary.tpm + "/" + players.stats.careerSummary.tpa,
                        ppg: players.stats.careerSummary.points,
                        asis: players.stats.careerSummary.assists,
                        plus: players.stats.careerSummary.plusMinus,
                        bolded: "font-weight: 900;"
                    })


                var avg = view.getViewById(page, "averageStats");
                avg.items = playerAvg;

                var tot = view.getViewById(page, "totalStats");
                tot.items = playerTot;
                page.getViewById("playerStatVis").visibility = "visible"


            }, (e) => {
                const viewModel = observableModule.fromObject({
                    playerName: name,
                    playerTeam: "No stats available for selected player.",
                    playerImage: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + id + ".png",
                    teamColour: "rgb(111, 111, 111)",
                });

                page.bindingContext = viewModel
            });
        }
        else {
            const viewModel = observableModule.fromObject({
                playerName: name,
                playerTeam: "No stats available for selected player.",
                playerImage: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + id + ".png",
                teamColour: "rgb(111, 111, 111)",
            });


            page.bindingContext = viewModel
        }
    }

    setStats()

}





exports.getPlayerData = getPlayerData

