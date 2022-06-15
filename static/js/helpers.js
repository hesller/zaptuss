const {Menu, MenuItem} = nodeRequire("electron").remote;
const customTitlebar = nodeRequire('custom-electron-titlebar');
const nodeFetch = nodeRequire("node-fetch")

module.exports.buildMenu = function (menu, currUser) {
    is_active = currUser['is_active']
    is_staff = currUser['is_staff']
    menu.append(new MenuItem({
        label: `Whatsapp`,
        submenu:  buildOptions(is_active, is_staff)
    }));
    new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#272c33'),
        menu: menu
    });
}


module.exports.analisePlan = function (currUser) {
    let planName = currUser['plan']['name'];
    console.log("the plan name inside helpers js", planName)
}


function buildOptions(is_active, is_staff) {
    if (is_active && is_staff) {
        return [
            {
                label: "Enviar Mensagem",
                click: () => { window.location.href = 'base_dashboard.html'}
            },
            {
                label: `Extrator de Grupos`,
                click: () => { window.location.href = 'groupExtractor.html'}
            },
            {
                label: `Gerador de Números`,
                click: () => { window.location.href = 'extractor.html'}
            }
        ]
    }
    else if (is_active) {
        return [
            {
                label: "Enviar Mensagem",
                click: () => { window.location.href = 'base_dashboard.html'}
            },
            {
                label: `Extrator de Grupos`,
                click: () => { window.location.href = 'groupExtractor.html'}
            },
        ]
    }
}
