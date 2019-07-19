const { App } = require("../core/App");
const db = require("./DataTransaction");

const MAX_CHOOSEN = 2;
const START_DAY = 0;
const END_DAY = 6;
const START_MONTH = 0;
const END_MONTH = 11;
const NUM_DAYS = 7;
const NUM_MONTH = 12;
const weekNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];

function getDayStartEnd(month, year) {
    const fd = new Date(year, month, 1);
    const ld = new Date(year, month + 1, 0);
    return {
        firstDay: fd.getDay(),
        lastDay: ld.getDay()
    };
}

function getMaxDay(month, year) {
    const _month = (month + 1) % (NUM_MONTH + 1);
    if (_month == 2) return year % 4 == 0 ? 29 : 28;
    if (_month <= 7) return _month % 2 == 1 ? 31 : 30;
    return _month % 2 == 1 ? 30 : 31;
}

function makeKeyboard(prefix, text, action = "noaction", args = "") {
    const callbackFormat = [prefix,text, action];
    for (let format of callbackFormat) {
        if (format.toString().includes("--"))
            throw new Error("Invalid callback format!");
    }

    if (args.match(/^(-)+/)) {
        throw new Error("args cannot prefix by '-'!");
    }

    return {
        text: `${text}`,
        callback_data: `${prefix}-${action}-${args}`
    };
}

function createArgs(day, month, year, row, col) {
    const args = `${day}@${month}@${year}@${row}@${col}`;
    if (!args.match(/(([0-9]+)@){4,}[0-9]+/)) {
        throw new Error("createArgs's params must be integer.");
    }
    if (day < 0) {
        throw new Error("Day must be positive integer.");
    }
    return args;
}

function parseArgs(args = "") {
    if (!args.match(/(([0-9]+)@){4,}[0-9]+/)) {
        throw new Error(
            "Invalid Args format. Args must be match to this pattern `/(([0-9]+)@){4,}[0-9]+/`."
        );
    }
    const [day, month, year, row, col] = args.split("@").map(e => parseInt(e));
    return { day, month, year, row, col };
}

function isWeekend(date, month, year) {
    const day = new Date(year, month, date).getDay();
    return day === START_DAY || day === END_DAY;
}

function fitMonth(month, type = "prev") {
    if (type == "prev") return month == START_MONTH ? END_MONTH : month - 1;
    return month == END_MONTH ? START_MONTH : month + 1;
}

function threeStateTogge(original, count) {
    if (count == 2) return "🗸🗸";
    if (count == 1) return "🗸" + original;
    return original;
}

function makeHeader(prefix, month, year, current) {
    const prevArgs = createArgs(0, month, year, 0, 0);
    const titleArgs = createArgs(0, month, year, 0, 1);
    const nextArgs = createArgs(0, month, year, 0, 2);
    const prev = makeKeyboard(
        prefix,
        month <= current ? "x" : "<<",
        month <= current ? "noaction" : "onPrev",
        prevArgs
    );
    const next = makeKeyboard(prefix, ">>", "onNext", nextArgs);
    const title = makeKeyboard(
        prefix,
        `${monthNames[month]}. ${year}`,
        "noaction",
        titleArgs
    );
    return [prev, title, next];
}

function makeFooter(prefix, resolve = "Process", reject = "Close") {
    return [
        makeKeyboard(prefix, resolve, `on${resolve}`),
        makeKeyboard(prefix, reject, `on${reject}`)
    ];
}

function countDay(startDate, endDate, exlcludeWeekend = true) {
    if (startDate.getTime() > endDate.getTime()) {
        const temp = startDate;
        startDate = endDate;
        endDate = temp;
    }
    let delta = Math.abs(
        Math.ceil((endDate - startDate) / (24 * 3600 * 1000) + 1)
    );
    if (exlcludeWeekend == true) {
        let counter = 0;
        for (
            let i = startDate.getDate();
            i < startDate.getDate() + delta;
            i++
        ) {
            if (isWeekend(i, startDate.getMonth(), startDate.getFullYear()))
                continue;
            counter++;
        }
        return counter;
    }
    return delta;
}

class CalendarKeyboard extends App {
    constructor(prefix, id) {
        super();

        this.prefix = prefix;
        this.id = id;
        this.date = new Date();
        this.calendar = null;
        this.dayNames = weekNames.map(name => makeKeyboard(this.prefix, name));
        this.register([
            "onPrev",
            "onNext",
            "noaction",
            "onChoose",
            "onProcess",
            "onClose"
        ]);
    }

    switchAction(day, month, year, action) {
        if (action == "noaction") {
            return {
                message: "-",
                action: "noaction"
            };
        }
        if (isWeekend(day, month, year)) {
            return {
                message: "x",
                action: "noaction"
            };
        }

        if (this.date.getMonth() == month && day < this.date.getDate()) {
            return {
                message: "-",
                action: "noaction"
            };
        }

        return {
            message: day,
            action: action
        };
    }

    makeCalendar(year, month, action) {
        const _month = month;
        const header = makeHeader(
            this.prefix,
            month,
            year,
            this.date.getMonth()
        );
        const footer = makeFooter(this.prefix);
        const subHeader = this.dayNames;
        const _calendar = [header, subHeader];
        const { firstDay } = getDayStartEnd(month, year);
        const lastdayPrevMonth = getMaxDay(month - 1, year);
        const numberDays = getMaxDay(month, year);
        let numberWeeks = Math.ceil((getMaxDay(month) + firstDay) / NUM_DAYS);
        let row = _calendar.length;
        let col = 0;
        let day = 1;
        let week = [];

        // load previous
        if (firstDay != START_DAY) {
            for (let fd = firstDay; fd > START_DAY; fd--) {
                const _day = lastdayPrevMonth - fd + 1;
                const _args = createArgs(_day, fitMonth(month), year, row, col);
                const task = this.switchAction(
                    _day,
                    fitMonth(month),
                    year,
                    "noaction"
                );
                week.push(
                    makeKeyboard(this.prefix, task.message, task.action, _args)
                );
                col = col + 1;
            }

            while (week.length !== NUM_DAYS) {
                const task = this.switchAction(day, month, year, action);
                const _args = createArgs(day, month, year, row, col);
                week.push(
                    makeKeyboard(this.prefix, task.message, task.action, _args)
                );
                day = day + 1;
                col = col + 1;
            }

            _calendar.push(week);
            numberWeeks = numberWeeks - 1;
            row = row + 1;
            week = [];
            col = 0;
        }

        while (numberWeeks > 0) {
            if (week.length == NUM_DAYS) {
                _calendar.push(week);
                numberWeeks = numberWeeks - 1;
                row = row + 1;
                col = 0;
                week = [];
            }

            const _args = createArgs(day, month, year, row, col);
            const task = this.switchAction(day, month, year, action);
            week.push(
                makeKeyboard(this.prefix, task.message, task.action, _args)
            );

            if (day === numberDays) {
                day = START_DAY;
                month = month + 1;
                action = "noaction";
            }

            day = day + 1;
            col = col + 1;
        }
        this.calendar = this.loadChoosen(_calendar, year, _month);
        this.calendar.push(footer);
        return this.calendar;
    }

    loadChoosen(calendar, year, month) {
        if (this.choosen) {
            for (let args of this.visited) {
                const data = parseArgs(args);
                if (data.month == month && data.year == year) {
                    const text = calendar[data.row][data.col].text;
                    if (text == `${data.day}`) {
                        calendar[data.row][data.col].text = threeStateTogge(
                            data.day,
                            this.visited.size == 2 ? 1 : 2
                        );
                    }
                }
            }
        }
        return calendar;
    }

    noaction(message="No Action") {
        return {
            type: "NoAction",
            message:message
        };
    }

    onPrev(args) {
        const data = parseArgs(args);
        if (data.month == START_MONTH) {
            data.month = END_MONTH;
            data.year -= 1;
        } else {
            data.month -= 1;
        }

        const message = this.renderMesage();
        return {
            id: this.id,
            type: "Edit",
            message: message == false ? "Prev" : message,
            options: {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: this.makeCalendar(
                        data.year,
                        data.month,
                        "onChoose"
                    )
                }
            }
        };
    }

    onNext(args) {
        const data = parseArgs(args);
        if (data.month == END_MONTH) {
            data.month = START_MONTH;
            data.year += 1;
        } else {
            data.month += 1;
        }

        const message = this.renderMesage();
        return {
            id: this.id,
            type: "Edit",
            message: message == false ? "Next" : message,
            options: {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: this.makeCalendar(
                        data.year,
                        data.month,
                        "onChoose"
                    )
                }
            }
        };
    }

    renderMesage() {
        if (!this.choosen) return false;
        if (this.choosen.length < 1) false;
        let message = "Selected :\n";
        for (let item of this.choosen) {
            const data = parseArgs(item);
            message += `- *${data.day}/${data.month}/${data.year}*\n`;
        }
        return message;
    }

    onChoose(args) {
        const data = parseArgs(args);
        let text = this.calendar[data.row][data.col].text;

        if (this.choosen == undefined) {
            this.visited = new Set([]);
            this.choosen = [];
        }

        if (this.choosen.length < MAX_CHOOSEN) {
            if (this.visited.has(args)) {
                text = threeStateTogge(data.day, 2);
            } else {
                text = threeStateTogge(data.day, 1);
            }
            this.visited.add(args);
            this.choosen.push(args);
        } else {
            // A2B0, A0B2, A1B1
            if (!this.visited.has(args)) return this.noaction();
            // arsg {a, b}
            if (this.visited.size == MAX_CHOOSEN) {
                //A1B1
                this.visited.delete(args);
                this.choosen.splice(this.choosen.indexOf(args), 1);
            } else {
                // A2B0 or A0B2
                this.choosen.splice(0, 2);
                this.visited.clear();
            }
            text = threeStateTogge(data.day, 0);
        }

        this.calendar[data.row][data.col].text = text;
        const message = this.renderMesage(this.choosen);
        return {
            id: this.id,
            type: "Edit",
            message: message == false ? "Choose" : message,
            options: {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: this.calendar
                }
            }
        };
    }

    async onProcess() {
        if (!this.choosen || this.choosen.length==0) return this.noaction("please choose start and end day!")
        if (this.visited.size==1 && this.choosen.length==1) return this.noaction("please choose end-day!")
        let startDate;
        let endDate;
        if (this.choosen.length == 1) {
            const start = parseArgs(this.choosen.pop())
            startDate = new Date(start.year, start.month, start.day);
        }else{
            const start = parseArgs(this.choosen[0]);
            const end = parseArgs(this.choosen[1]);
            startDate = new Date(start.year, start.month, start.day);
            endDate = new Date(end.year, end.month, end.day);
        }

        const long = countDay(startDate, endDate);
        await db.userDayOff({
            userID: this.id,
            startDate: startDate,
            long: long,
            reason: "Cuti"
        });
        return {
            type: "Edit",
            id: this.id,
            destroy: true,
            message: "*Success!*",
            options: {
                parse_mode: "Markdown"
            }
        };
    }

    onClose() {
        return {
            type: "Delete",
            id: this.id,
            destroy: true
        };
    }
}

module.exports = {
    CalendarKeyboard,
    getDayStartEnd,
    getMaxDay,
    makeKeyboard,
    createArgs,
    parseArgs,
    isWeekend,
    fitMonth,
    threeStateTogge,
    makeHeader,
    makeFooter,
    countDay
};
