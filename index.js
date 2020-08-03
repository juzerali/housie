class HousieGame {
    constructor(id, name, drawn = [], createdAt = new Date) {
        this._id = id || window.randomId();
        this.name = name;
        this.drawn = drawn;
        this.createdAt = createdAt;
        this._engine = new Random();

        this._numbers = [];

        for (var i = 1; i <= 90; i++) {
            if (!this.drawn.includes(i)) this._numbers.push(i);
        }
    }

    draw() {
        if (this._numbers.length === 0) throw "Error: Game is complete!!!"

        const picked = this._engine.pick(this._numbers);
        this._numbers = this._numbers.filter(function (num) {
            return num !== picked;
        });
        this.drawn.push(picked);
        return picked;
    }

    numbersDrawn() {
        return this.drawn.length;
    }

    numbersLeft() {
        return this._numbers.length;
    }

    createdAtReadable() {
        if (this.createdAt instanceof Date) return this.createdAt.toLocaleString();
        return "";
    }

    lastDrawn() {
        if (this.drawn.length == 0) return null;
        return this.drawn[this.drawn.length - 1];
    }

    toJSON() {
        return {
            _id: this._id,
            name: this.name,
            drawn: this.drawn,
            createdAt: this.createdAt
        }
    }
}

HousieGame.fromDoc = (doc) => new HousieGame(doc._id, doc.name, doc.drawn, new Date(doc.createdAt));

$(async () => {
    let gameDB = new PouchDB("games");
    let prefsDB = new PouchDB("prefs");
    window.gameDB = gameDB;
    window.prefsDB = prefsDB;
    let hash = window.location.hash.substring(1);
    if (hash.length > 0) {
        window.load(hash);
    } else {
        showCreateWidget();
    }

    $("#delete-all-games").on("click", async (e) => {
        e.preventDefault();

        if (!confirm("WARNING!!! \nAre you sure? This action is irreversible.")) return;

        await gameDB.destroy();
        window.gameDB = new PouchDB("games");
        window.showCreateWidget();
    });

    $("#new-game-name").on("keyup", (e) => e.stopPropagation());
    window.APP = window.app = new App();
});

window.draw = $.throttle(2000, true, async function (nums = 1) {
    if (!Number.isInteger(nums) || nums < 1) nums = 1;
    try {
        var picked;
        for (let i = 0; i < nums; i++) {
            picked = window.GAME.draw();
        }
    } catch (e) {
        alert(e);
    }

    let game = await gameDB.get(window.GAME._id);
    game.drawn = window.GAME.drawn;
    gameDB.put(game);
    render();
    window.speaker().speak(picked);
    return picked;
})

async function load(id) {
    try {
        let result = await window.gameDB.allDocs()
        let gameDoc = result.rows.find((game) => id === game.id)

        if (!gameDoc) return alert("NOT FOUND!");
        let game = await window.gameDB.get(gameDoc.id)
        window.GAME = new HousieGame(gameDoc.id, game.name, game.drawn);
        render();
        showGameWindow();
    } catch (e) {
        alert("Game not found!")
        window.location.hash = "";
    }
}

function render(game = window.GAME) {
    $("#game-name").text(game.name);
    let drawSequence = $("#draw-sequence").html("");

    for (let num = 1; num <= 90; num++) {
        let $elem = $(`#num-${num}`)
            .removeClass("drawn")
            .removeClass("last-drawn");

        if (game.drawn.includes(num)) {
            $elem.addClass("drawn");
        }
    }

    game.drawn.forEach((num) => {
        let historyElement = $("<span>");
        historyElement.text(num + ", ");
        drawSequence.append(historyElement);
    });

    $("#num-" + game.lastDrawn()).addClass("last-drawn")
    window.location.hash = game._id;
}

function createNewGame() {
    try {
        let textField = document.getElementById("new-game-name")
        let name = textField.value;
        textField.value = "";

        let game = new HousieGame(null, name);
        window.GAME = game;
        window.gameDB.put(game.toJSON());
        render(game);
        showGameWindow();
    } catch (e) {
        alert("There was some error!!");
        throw e;
    }
    return false;
}

async function showCreateWidget() {
    let gameDB = new PouchDB("games");
    $(document).off("keyup");
    $(document).on("keyup", (e) => {
        e.key === "/" && $("#new-game-name").focus();
    });
    window.location.hash = "";
    $("#create-new-game-widget").removeClass("hidden");
    $("#game-window").addClass("hidden");

    let $existingGamesList = $("#previous-games-list").empty();
    let result = await gameDB.allDocs();
    let games = await Promise.all(result.rows.map(async (row) => {
            return gameDB.get(row.id);
        })
    );

    games = games.map((g => new HousieGame(g._id, g.name, g.drawn, new Date(g.createdAt))))
        .sort((a, b) => a.createdAt.getTime() > b.createdAt.getTime() ? -1 : 1);

    games.forEach(await async function (game, i) {
        let shortKey = i + 1;
        let id = game._id;
        let $li = $("<a>", {
            "class": "list-group-item list-group-item-action",
            href: "#"
        });

        game = new HousieGame(id, game.name, game.drawn, new Date(game.createdAt));

        function insertLineItem(game, li) {
            let a = $("<a>");
            let createdAtField = $("<span>");
            let keyboardIcon = $(`<span class="badge badge-warning"><svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-keyboard-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M0 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6zm13 .25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zM2.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 3 8.75v-.5A.25.25 0 0 0 2.75 8h-.5zM4 8.25A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75v-.5zM6.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 7 8.75v-.5A.25.25 0 0 0 6.75 8h-.5zM8 8.25A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75v-.5zM13.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5zm0 2a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5zm-3-2a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h1.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-1.5zm.75 2.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zM11.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5zM9 6.25A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75v-.5zM7.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 8 6.75v-.5A.25.25 0 0 0 7.75 6h-.5zM5 6.25A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75v-.5zM2.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h1.5A.25.25 0 0 0 4 6.75v-.5A.25.25 0 0 0 3.75 6h-1.5zM2 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zM4.25 10a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-5.5z"/></svg> ${shortKey} </span>`)
            a.attr("href", "#" + id).text(" " + game.name);
            a.on("click", function () {
                window.load(game._id);
            });
            createdAtField.text(` (${game.createdAtReadable()})`);
            let deleteIcon = $(`<a href="#"><svg color="red" width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7z"/></svg></a>`)
            deleteIcon.click(async () => {
                let doc = await gameDB.get(id);
                await gameDB.remove(doc);
                let undo = $(`<a href='#'>Restore ${doc.name} ↩</a>`);
                li.empty().append(undo);

                undo.click(async () => {
                    let newdoc = await gameDB.put({
                        _id: window.randomId(),
                        name: doc.name,
                        drawn: doc.drawn,
                        createdAt: doc.createdAt
                    });
                    newdoc = await gameDB.get(newdoc.id);
                    id = newdoc._id;
                    game = HousieGame.fromDoc(newdoc);
                    insertLineItem(game, li)
                });
            });

            return $("<span></span>")
                .append(keyboardIcon)
                .append(a)
                .append(createdAtField)
                .append(deleteIcon)
                .appendTo(li.empty());
        }

        insertLineItem(game, $li);
        $li.appendTo($existingGamesList);

        $(document).on("keyup", (e) => {
            if (e.key == shortKey) {
                window.load(id);
            }
        });
    });
}

function showGameWindow() {
    document.getElementById("create-new-game-widget").className = "hidden"
    document.getElementById("game-window").className = ""

    $(document)
        .off("keyup")
        .on("keyup", (e) => {
            if (e.key === "D" || e.key === "d" || e.key === " ") {
                window.draw();
            } else if (e.key === "Backspace" || e.key === "n" || e.key === "u") {
                window.showCreateWidget();
            } else if (e.key === "m") {
                window.APP.toggleMute();
            }
        });
}

function randomId() {
    return (new Date).getTime().toString(36);
}

window.speaker = function (number) {
    if (!window.SpeechSynthesisUtterance || window.APP.isMuted()) return new NoopSpeaker();
    return new ChromeSpeaker();
}

class ChromeSpeaker {
    constructor() {
        this.engine = new Random();
        this.eligibleVoices = window.speechSynthesis
            .getVoices()
            .filter((v) => v.lang.toLowerCase().startsWith("en"));
    }

    speak(number) {
        if (!number) return;
        number = number.toString();
        let msg = "";
        if (number.length < 2) {
            msg = "single number " + number;
        } else {
            msg = number.split("").join(" ");
            msg += ", " + number;
        }

        var msgObj = new SpeechSynthesisUtterance(msg);
        msgObj.voice = this.engine.pick(this.eligibleVoices);
        window.speechSynthesis.speak(msgObj);
    }

    speakFn(number) {
        return () => this.speak(number);
    }
}

class NoopSpeaker {
    speak(number) {
    }
}

class App {
    constructor() {
        let self = this;
        window.prefsDB.get("muted?").then((muted) => {
            self.muted = muted.value;
            self.muted ? self.mute() : self.unmute();
        }).catch(() => {
            self.muted = false;
            window.prefsDB.put({
                _id: "muted?",
                value: false
            });
        });
    }

    async mute() {
        window.speechSynthesis && window.speechSynthesis.cancel();
        this.muted = true;
        $("#volume-control").addClass("muted");
        console.log("MUTED");

        let mutePref = await window.prefsDB.get("muted?");
        mutePref.value = true;
        window.prefsDB.put(mutePref);
    }

    async unmute() {
        this.muted = false
        $("#volume-control").removeClass("muted");
        console.log("UNMUTED");

        let mutePref = await window.prefsDB.get("muted?");
        mutePref.value = false;
        window.prefsDB.put(mutePref);
    }

    toggleMute() {
        this.muted ? this.unmute() : this.mute();
    }

    isMuted() {
        return this.muted;
    }
}