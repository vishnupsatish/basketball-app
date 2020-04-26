const view = require("tns-core-modules/ui/core/view");
const httpModule = require("tns-core-modules/http");
const Frame = require("tns-core-modules/ui/frame").Frame;
const key = require("./config.js").keys;
var observableModule = require("data/observable");
var observableArrayModule = require("data/observable-array")
const utilsModule = require("tns-core-modules/utils/utils");
const timerModule = require("tns-core-modules/timer");
const appSettings = require("tns-core-modules/application-settings");





const topmostFrame = Frame.topmost();


var drawer;



exports.toggleDrawer = function () {
    drawer.toggleDrawerState();
};



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

exports.goToNews = function (args) {
    var url = args.object.url;
    var feedback = new FeedbackPlugin.Feedback();
    feedback.show({
        type: FeedbackPlugin.FeedbackType.Info,
        title: "Going to nytimes.com",
        message: "You will now be redirected to an external news website."
    })
    timerModule.setTimeout(() => {
        utilsModule.openUrl(url)
    }, 1000);


}

exports.goToAttr = function (args) {
    utilsModule.openUrl("https://developer.nytimes.com")

}



exports.pageLoaded = function(args) {
    const page = args.object
    drawer = view.getViewById(page, "sideDrawer");

    var viewModel = observableModule.fromObject({
        items: new observableArrayModule.ObservableArray([])
    });
    var image = []
    var newsTitle = []
    var url = []
    var newsDesc = []
    var author = []
    httpModule.request({
        url: "https://api.nytimes.com/svc/search/v2/articlesearch.json?q=nba&api-key=" + key.newsKey,
        method: "GET"
    }).then((response) => {
        var news = JSON.parse(response.content.toString()).response.docs
        for (var i = 0; i < news.length; i++) {
            if (news[i].multimedia.length !== 0) {
                image.push("https://nytimes.com/" + news[i].multimedia[0].url)
            }
            else {
                image.push("~/images/newspaper.png")
            }


            newsTitle.push(news[i].headline.main)
            url.push(news[i].web_url)
            newsDesc.push(news[i].abstract)
            author.push(news[i].byline.original)
            console.log(image)

        }
        for (var j = 0; j < newsTitle.length; j++) {
            viewModel.items.push({author: author[j], newsDesc: newsDesc[j], newsTitle: newsTitle[j], image: image[j], url: url[j]})
        }


        page.bindingContext = viewModel

        page.getViewById("nyAttri").visibility = "visible"

    }, (e) => {
    });

}

