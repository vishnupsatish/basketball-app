const view = require("tns-core-modules/ui/core/view");
var drawer;
const utilsModule = require("tns-core-modules/utils/utils");



exports.toggleDrawer = function() {
    drawer.toggleDrawerState();
};

exports.aboutLoaded = function (args) {
    const page = args.object;
    drawer = view.getViewById(page, "sideDrawer");
}
exports.changePage = function (args) {
    const button = args.object;
    const page = button.page;
    console.log(args.object.where)
    const folder = args.object.where
    const file = args.object.where.toLowerCase();
    page.frame.navigate(folder+"/"+file);
};

exports.goToUrl = function (args) {
    utilsModule.openUrl(args.object.url)

}
