const Observable = require("tns-core-modules/data/observable").Observable;

exports.getWebview = function(args) {
    const page = args.object;
    const webViewInfo = new Observable();
    webViewInfo.set("webViewSrc", page.navigationContext["info"]);
    page.bindingContext = webViewInfo;
    var webView = page.getViewById("newsWebview");
    if(webView.android) {
        webView.android.getSettings().setBuiltInZoomControls(false);
    }
}

exports.goBack = function(args) {
    const button = args.object;
    const page = button.page;
    page.frame.goBack();
}

const connectivityModule = require("tns-core-modules/connectivity");
var FeedbackPlugin = require("nativescript-feedback");
exports.checkConnection = function(args) {
    const type = connectivityModule.getConnectionType();
    console.log(connectivityModule.connectionType.none)
    if (type === 0) {
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
