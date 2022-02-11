const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();

// import the own utils 
const Settings = Me.imports.utils

const TW_URL = `https://api-osmosis.imperator.co/tokens/v1/all`;

let _httpSession, twMenu, myPopup;

const MyPopup = GObject.registerClass(
    class MyPopup extends PanelMenu.Button {
        _init() {
            super._init(1);

            let icon = new St.Icon({
                // icon_name: 'hand-holding-us-dollar',
                gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/atom.svg'),
                style_class: 'system-status-icon',
            });

            this.add_child(icon);
            this._refresh();
        }

        _refresh() {
            let settings = Settings.GetSettings()
            // log("my curreny:" + settings.get_enum('currency'));
            this._loadData(this._refreshUI);
            this._removeTimeout();
            // fetch every 60seconds 
            this._timeout = Mainloop.timeout_add_seconds(60, Lang.bind(this, this._refresh));
            return true;
        }

        _loadData() {
            _httpSession = new Soup.Session();
            let request = Soup.Message.new('GET', TW_URL);
            _httpSession.queue_message(request, Lang.bind(this,
                function (session, message) {
                    if (message.status_code !== 200) {
                        return;
                    }
                    let data = JSON.parse(request.response_body.data)
                    this._refreshUI(data)
                }
            )
            );
        }

        _refreshUI(data) {
            this.menu.removeAll();
            data = data.sort((b, c) => { return b.price - c.price }).reverse()
            for (let i = 0; i < 5; i++) {
                let result = data[i]
                let currenyFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 10, style: 'currency', currency: 'USD' }).format(result.price)
                let item = new PopupMenu.PopupImageMenuItem(
                    `${result.name} (${result.symbol}) : ${currenyFormat}`,
                    Gio.icon_new_for_string(Me.dir.get_path() + '/icons/' + result.symbol.toLowerCase() + ".png")
                )
                this.menu.addMenuItem(item)
            }
            for (let i = 5; i < data.length; i += 5) {
                let subItem = new PopupMenu.PopupSubMenuMenuItem(`Top ${i + 5} Coins List`);
                this.menu.addMenuItem(subItem)
                for (let j = i; j < i + 5; j++) {
                    let result = data[j]
                    let currenyFormat = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 10, style: 'currency', currency: 'USD' }).format(result.price)
                    let item = new PopupMenu.PopupImageMenuItem(
                        `${result.name} (${result.symbol}) : ${currenyFormat}`,
                        Gio.icon_new_for_string(Me.dir.get_path() + '/icons/' + result.symbol.toLowerCase() + ".png")
                    )
                    subItem.menu.addMenuItem(item)
                }
            }
        }

        _removeTimeout() {
            if (this._timeout) {
                Mainloop.source_remove(this._timeout);
                this._timeout = null;
            }
        }

        stop() {
            if (_httpSession !== undefined) {
                _httpSession.abort();
            }
            _httpSession = undefined;

            if (this._timeout) {
                Mainloop.source_remove(this._timeout);
            }
            this._timeout = undefined;

            this.menu.removeAll();
        }
    }
);


function init() {
}

function enable() {
    myPopup = new MyPopup();
    Main.panel.addToStatusArea('myPopup', myPopup, 1)
}

function disable() {
    myPopup.stop();
    myPopup.destroy();
}