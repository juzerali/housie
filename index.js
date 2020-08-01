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
        if(this.drawn.length == 0) return null;
        return this.drawn[this.drawn.length-1];
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

$(function () {
    var gameDB = new PouchDB("games")
    window.gameDB = gameDB;
    var hash = window.location.hash.substring(1);
    if (hash.length > 0) {
        window.load(hash);
    }

    $("#delete-all-games").on("click", (e) => {
        e.preventDefault();

        if (!confirm("WARNING!!! \nAre you sure? This action is irreversible.")) return;

        window.gameDB.destroy(() => window.location.reload());
    });

    $("#new-game-name").on("keyup", (e) => e.stopPropagation());
    showCreateWidget();
});

window.draw = $.throttle(2000, true, function (nums = 1) {
    if (!Number.isInteger(nums) || nums < 1) nums = 1;
    try {
        var picked;
        for (let i = 0; i < nums; i++) {
            picked = window.GAME.draw();
        }
        gameDB.get(window.GAME._id).then(function (game) {
            game.drawn = window.GAME.drawn;
            gameDB.put(game);
        })
    } catch (e) {
        alert(e);
    }
    render(window.GAME)
    window.speaker().speak(picked);
})

function load(id) {
    window.gameDB.allDocs().then(function (result) {
        var gameDoc = result.rows.find((game) => id == game.id)

        if (!gameDoc) return alert("NOT FOUND!");
        window.gameDB.get(gameDoc.id).then(function (game) {
            window.GAME = new HousieGame(gameDoc.id, game.name, game.drawn);
            render(window.GAME);
            showGameWindow();
        }).catch(() => {
            alert("Game not found!")
            window.location.hash = "";
        });
    });
}

function render(game) {
    $("#game-name").text(game.name);
    var drawSequence = $("#draw-sequence");
    drawSequence.html("");

    for (let num = 1; num <= 90; num++) {
        let $elem = $(`#num-${num}`)
            .removeClass("drawn")
            .removeClass("last-drawn");

        if(game.drawn.includes(num)) {
            $elem.addClass("drawn");

            var historyElement = $("<span>");
            historyElement.text(num + ", ");
            drawSequence.append(historyElement);
        }
    }

    $("#num-" + game.lastDrawn()).addClass("last-drawn")
    window.location.hash = game._id;
}

function createNewGame() {
    try {
        var textField = document.getElementById("new-game-name")
        var name = textField.value;
        textField.value = "";

        var game = new HousieGame(null, name);
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

function showCreateWidget() {
    $(document).off("keyup");
    $(document).on("keyup", (e) => {
        e.key === "/" && $("#new-game-name").focus();
    });
    window.location.hash = "";
    $("#create-new-game-widget").removeClass("hidden");
    $("#game-window").addClass("hidden");

    gameDB.allDocs().then(function (result) {
        var previousList = $("#previous-games-list").empty();
        result.rows.forEach(function (row, i) {
            var shortKey = i + 1;
            var id = row.id;
            gameDB.get(row.id).then(function (game) {
                game = new HousieGame(row.id, game.name, game.drawn, new Date(game.createdAt));
                var p = $("<li>");
                var a = $("<a>");
                var span = $("<span>");
                var icon = $(`<span><svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-keyboard-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M0 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6zm13 .25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zM2.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 3 8.75v-.5A.25.25 0 0 0 2.75 8h-.5zM4 8.25A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75v-.5zM6.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 7 8.75v-.5A.25.25 0 0 0 6.75 8h-.5zM8 8.25A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75v-.5zM13.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5zm0 2a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5zm-3-2a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h1.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-1.5zm.75 2.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zM11.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5zM9 6.25A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75v-.5zM7.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 8 6.75v-.5A.25.25 0 0 0 7.75 6h-.5zM5 6.25A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75v-.5zM2.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h1.5A.25.25 0 0 0 4 6.75v-.5A.25.25 0 0 0 3.75 6h-1.5zM2 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5zM4.25 10a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-5.5z"/></svg> ${shortKey} </span>`)
                a.attr("href", "#" + row.id).text(game.name);
                span.text(` (${game.createdAtReadable()})`);
                p
                    .append(icon)
                    .append(a)
                    .append(span);
                previousList.append(p);

                a.on("click", function () {
                    window.load(row.id);
                });
                $(document).on("keyup", (e) => {
                    if (e.key == shortKey) {
                        window.load(id);
                    }
                });
            });
        });
    });
}

function showGameWindow() {
    document.getElementById("create-new-game-widget").className = "hidden"
    document.getElementById("game-window").className = ""

    $(document).off("keyup");
    $(document).on("keyup", (e) => {
        if (e.key == "D" || e.key == "d" || e.key == " ") {
            window.draw();
        } else if (e.key == "Backspace" || e.key == "n" || e.key == "u") {
            window.showCreateWidget();
        }
    });
}

function randomId() {
    return (Math.random() * Math.pow(10, 16)).toString(36);
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
        this.muted = false;
    }

    mute() {
        this.muted = true
    }

    unmute() {
        this.muted = false
    }

    isMuted() {
        return this.muted;
    }
}

window.APP = new App;