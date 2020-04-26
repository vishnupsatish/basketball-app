const view = require("tns-core-modules/ui/core/view");
const httpModule = require("tns-core-modules/http");
const colours = require("../JSON/colour.js").colours;
const Frame = require("tns-core-modules/ui/frame").Frame;
const timerModule = require("tns-core-modules/timer");
const teams = require("../JSON/teams.js").teams;
const observableModule = require("tns-core-modules/data/observable");
const appSettings = require("tns-core-modules/application-settings");
var observableArrayModule = require("data/observable-array")
const imageModule = require("nativescript-image");
imageModule.initialize({ isDownsampleEnabled: true });
var toGoPlayer = {}


const connectivityModule = require("tns-core-modules/connectivity");
var FeedbackPlugin = require("nativescript-feedback");
exports.checkConnection = function (args) {
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

exports.specificPlayer = function (args) {
    const page = args.object.page
    var game = args.object.player;
    var navigationEntry = {
        moduleName: "Specific-Player/specific-player",
        context: {info: game},
        animated: true,
        transition: {
            name: "fade",
            duration: 380,
            //curve: "easeIn"
        }
    };
    page.frame.navigate(navigationEntry);
}

function formatDate(date) {
    var d = new Date(Number(date)),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

function openPlayer(args) {
    const page = args.object.page
    var name = args.object.name
    var id = args.object.player
    toGoPlayer.name = name
    toGoPlayer.id = id
    var navigationEntry = {
        moduleName: "Specific-Player/specific-player",
        context: { info: toGoPlayer },
        animated: true,
        transition: {
            name: "fade",
            duration: 380,
            //curve: "easeIn"
        }
    };
    page.frame.navigate(navigationEntry);
}

exports.openPlayer = openPlayer



function getData(args) {
    const page = args.object
    teamCode = page.navigationContext.info

    httpModule.request({
        url: "https://ca.global.nba.com/stats2/team/standing.json?locale=en&teamCode=" + teamCode,
        method: "GET"
    }).then((response) => {
		const fullTeam = JSON.parse(response.content.toString()).payload
        const team = JSON.parse(response.content.toString()).payload.team
        const teamName = team.profile.city + " " + team.profile.name
        for (var j = 0; j < colours.length; j++) {
            if (colours[j].name == teamName || colours[j].altName == teamName) {
                var colour = "rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")"
            }
        }
        const viewModel = observableModule.fromObject({
            colour: colour,
            teamLogo: "https://alleyoop.sirv.com/" + teamName + ".png",
            teamName: teamName,
            winloss: team.standings.wins + "/" + team.standings.losses,
            coach: "Head coach: " + team.coach.headCoach

        });
		page.getViewById("record").text = "Record: " + team.standings.wins + "/" + team.standings.losses
		page.getViewById("confrank").text = ordinal_suffix_of(Number(team.standings.confRank)) + " in the " + team.profile.conference + " Conference"
		page.getViewById("last10").text = "Last 10: " + team.standings.last10
		page.getViewById("streak").text = "Streak: " + team.standings.streak


        page.bindingContext = viewModel
    }, (e) => {
    });


    httpModule.request({
        url: "https://ca.global.nba.com/stats2/team/roster.json?locale=en&teamCode=" + teamCode,
        method: "GET"
    }).then((response) => {
        var items = []

        const players = JSON.parse(response.content.toString()).payload.players
        const teamData = JSON.parse(response.content.toString()).payload.profile
        for (var i = 0; i < players.length; i++) {
            var player = players[i].profile
            fullName = player.firstName + " " + player.lastName
            var idAndName = {
                name: fullName,
                id: player.playerId,
                year: "Only active",
                city: teamData.city,
                nickname: teamData.name
            }
            const teamName = teamData.city + " " + teamData.name
            for (var j = 0; j < colours.length; j++) {
                if (colours[j].name == teamName || colours[j].altName == teamName) {
                    var colour = "rgb(" + colours[j].colors.rgb[0].split(/[ ,]+/).join(',') + ")"
                    const currentR = Number(colours[j].colors.rgb[0].split(/[ ,]+/)[0])
                    const currentG = Number(colours[j].colors.rgb[0].split(/[ ,]+/)[1])
                    const currentB = Number(colours[j].colors.rgb[0].split(/[ ,]+/)[2])
                    const newR = currentR + (255 - currentR) * 0.4
                    const newG = currentG + (255 - currentG) * 0.4
                    const newB = currentB + (255 - currentB) * 0.4
                    var colour2 = "rgb(" + newR + "," + newG + "," + newB + ")"

                }
            }
            items.push(
                {
                    playerName: player.firstName + " " + player.lastName,
                    playerTeam: teamName,
                    teamImage: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + player.playerId + ".png",
                    playerFull: player.personId,
                    backColour: colour,
                    imgColour: colour2,
                    idAndName: idAndName
                })
        }
        var listview = view.getViewById(page, "listview");
        listview.items = items;






        

    }, (e) => {
    });
	
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
        url: "https://ca.global.nba.com/stats2/team/schedule.json?countryCode=CA&locale=en&teamCode=" + teamCode,
        method: "GET"
    }).then((response) => {
        var games = JSON.parse(response.content.toString()).payload.monthGroups

        for (var i = games.length - 1; i >= 0; i--) {
            for (var j = games[i].games.length - 1; j >= 0; j--) {
                currentGame = games[i].games[j]
                const today = formatDate(currentGame.profile.utcMillis)
                var home = currentGame.homeTeam.profile.city + " " + currentGame.homeTeam.profile.name
                var visitor = currentGame.awayTeam.profile.city + " " + currentGame.awayTeam.profile.name
                var homeShort = currentGame.homeTeam.profile.name
                var awayShort = currentGame.awayTeam.profile.name
                homeTeams.push("https://alleyoop.sirv.com/" + home + ".png")
                awayTeams.push("https://alleyoop.sirv.com/" + visitor + ".png")
                if (currentGame.boxscore.status === "1") {
                    gameStatuses.push("Not started" + "\n" + currentGame.boxscore.statusDesc + "\n" + today)
                    teamStatuses.push(homeShort + " - " + awayShort)

                } else if (currentGame.boxscore.status === "3") {
                    gameStatuses.push("Final" + "\n" + today)
                    teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
                } else {
                    gameStatuses.push(today + "\n" + "Live")
                    teamStatuses.push(homeShort + " " + currentGame.boxscore.homeScore + " - " + currentGame.boxscore.awayScore + " " + awayShort)
                }
                gameData.push(currentGame.profile.gameId)
                for (var k = 0; k < colours.length; k++) {
                    if (home == colours[k].name || home == colours[k].altName) {
                        colour.push("rgb(" + colours[k].colors.rgb[0].split(/[ ,]+/).join(',') + ")")
                    }
                }
            }


        }

        var match = []
        for (var j = 0; j < homeTeams.length; j++) {
            match.push({
                    homeTeam: homeTeams[j],
                    awayTeam: awayTeams[j],
                    gameStatus: gameStatuses[j],
                    teamStatus: teamStatuses[j],
                    colour: colour[j],
                    gameData: gameData[j]}
            )
        }
        const repeat = view.getViewById(page, "repeat");
        repeat.items = match;

    }, (e) => {
    });
	
	
	
	httpModule.request({
	    url: "https://ca.global.nba.com/stats2/team/stats.json?countryCode=CA&locale=en&teamCode=" + teamCode,
	    method: "GET"
	}).then((response) => {
	    const stats = JSON.parse(response.content.toString()).payload.seasons;
		var teamAvg = []
		teamAvg.push({
			yr: "Year",
			type:"Type",
			ppg: "ppg",
			apg: "apg",
			fgpct: "FG%",
			ftpct: "FT%",
			bolded: "font-weight: 900;"
		})
		for (var i = 0; i < stats.length; i++) {
			if (stats[i].seasonType == 2 || stats[i].seasonType == 4) {
				const season = stats[i]
				const seasonType = stats[i].seasonType == 2 ? "Reg." : "Plys."
				teamAvg.push({
					yr: season.year,
					type: seasonType,
					ppg: season.team.statAverage.pointsPg,
					apg: season.team.statAverage.assistsPg,
					fgpct: season.team.statAverage.fgpct,
					ftpct: season.team.statAverage.ftpct,
					bolded: "font-weight: 400;"
				})
			}
		}
		console.log(page.getViewById("averageStats"))
		page.getViewById("averageStats").items = teamAvg
		
	}, (e) => {
	});
	
	httpModule.request({
	    url: "https://ca.global.nba.com/stats2/team/leader.json?countryCode=CA&locale=en&teamCode=" + teamCode,
	    method: "GET"
	}).then((response) => {
		const leaders = JSON.parse(response.content.toString()).payload;
		var pointLeaders = []
		for (var i = 0; i < leaders.pointLeader.players.length; i++) {
			currentPlayer = leaders.pointLeader.players[i]
			pointLeaders.push({
				fullName: currentPlayer.profile.firstName + " " + currentPlayer.profile.lastName,
				id: currentPlayer.profile.playerId,
				rank: currentPlayer.rank,
				points: currentPlayer.value,
				img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png"
			})
		}
		page.getViewById("leaders").items = pointLeaders
		
		
		var reboundLeaders = []
		for (var i = 0; i < leaders.reboundLeader.players.length; i++) {
			currentPlayer = leaders.reboundLeader.players[i]
			reboundLeaders.push({
				fullName: currentPlayer.profile.firstName + " " + currentPlayer.profile.lastName,
				id: currentPlayer.profile.playerId,
				rank: currentPlayer.rank,
				rebounds: currentPlayer.value,
				img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png"
			})
		}
		page.getViewById("rleaders").items = reboundLeaders
		
		
		var assistLeaders = []
		for (var i = 0; i < leaders.assistLeader.players.length; i++) {
			currentPlayer = leaders.assistLeader.players[i]
			assistLeaders.push({
				fullName: currentPlayer.profile.firstName + " " + currentPlayer.profile.lastName,
				id: currentPlayer.profile.playerId,
				rank: currentPlayer.rank,
				assists: currentPlayer.value,
				img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png"
			})
		}
		page.getViewById("aleaders").items = assistLeaders
		
		
		var blockLeaders = []
		for (var i = 0; i < leaders.blockLeader.players.length; i++) {
			currentPlayer = leaders.blockLeader.players[i]
			blockLeaders.push({
				fullName: currentPlayer.profile.firstName + " " + currentPlayer.profile.lastName,
				id: currentPlayer.profile.playerId,
				rank: currentPlayer.rank,
				blocks: currentPlayer.value,
				img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png"
			})
		}
		page.getViewById("bleaders").items = blockLeaders
		
		
		var threeLeaders = []
		for (var i = 0; i < leaders.threePtPctLeader.players.length; i++) {
			currentPlayer = leaders.threePtPctLeader.players[i]
			threeLeaders.push({
				fullName: currentPlayer.profile.firstName + " " + currentPlayer.profile.lastName,
				id: currentPlayer.profile.playerId,
				rank: currentPlayer.rank,
				threepct: currentPlayer.value,
				img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png"
			})
		}
		page.getViewById("tleaders").items = threeLeaders
		
		
		var fgLeaders = []
		for (var i = 0; i < leaders.fgPctLeader.players.length; i++) {
			currentPlayer = leaders.fgPctLeader.players[i]
			fgLeaders.push({
				fullName: currentPlayer.profile.firstName + " " + currentPlayer.profile.lastName,
				id: currentPlayer.profile.playerId,
				rank: currentPlayer.rank,
				fgpct: currentPlayer.value,
				img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png"
			})
		}
		page.getViewById("fleaders").items = fgLeaders
		
		
		var minLeaders = []
		for (var i = 0; i < leaders.minLeader.players.length; i++) {
			currentPlayer = leaders.minLeader.players[i]
			minLeaders.push({
				fullName: currentPlayer.profile.firstName + " " + currentPlayer.profile.lastName,
				id: currentPlayer.profile.playerId,
				rank: currentPlayer.rank,
				minutes: currentPlayer.value,
				img: "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/" + currentPlayer.profile.playerId + ".png"
			})
		}
		page.getViewById("mleaders").items = minLeaders
		
		
		
	}, (e) => {
	});
	

}

exports.tabsLoaded = function (args) {
	var myTabView = args.object
	if (myTabView.android.getChildAt(1)) {
		myTabView.android.removeViewAt(1);
	}
	
}

exports.leaderChanged = function(args) {
	const page = args.object.page
	const tab = page.getViewById("leaderTabs")
	page.getViewById("leaderLabel").text = page.getViewById("tab" + String(tab.selectedIndex)).text
	
}

exports.move = function (args) {
	const page = args.object.page
	const tab = page.getViewById("leaderTabs")
	if (args.object.dir === "right") {
		if (tab.selectedIndex != 6) {
			tab.selectedIndex = tab.selectedIndex + 1
		}
		else {
			tab.selectedIndex = 0
		}
	}
	else {
		if (tab.selectedIndex != 0) {
			tab.selectedIndex = tab.selectedIndex - 1
		}
		else {
			tab.selectedIndex = 6
		}
	}
	//console.log("tab" + tab.selectedIndex)
}

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

exports.getData = getData
