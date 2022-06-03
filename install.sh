rm gsk967@github.com.shell-extension.zip
zip -r gsk967@github.com.shell-extension.zip . -x '*.git*' -x '*.vscode*'
gnome-extensions uninstall gsk967@github.com
gnome-extensions install --force gsk967@github.com.shell-extension.zip
