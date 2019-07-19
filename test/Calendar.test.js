const assert = require("assert");
const cldr = require("../app/Calendar");

describe("Test app/Calendar.js", () => {
    describe("#getDayStartEnd", () => {
        it("July 2019 start-day is 'Monday' and end-day on 'Wednesday'  ", () => {
            const result = cldr.getDayStartEnd(6, 2019);
            assert.equal(result.firstDay == 1 && result.lastDay == 3, true);
        });

        it("February start-day is 'Saturday' and end-day on 'Saturday'  ", () => {
            const result = cldr.getDayStartEnd(1, 2020);
            assert.equal(result.firstDay == 6 && result.lastDay == 6, true);
        });
    });

    describe("#getMaxDay", () => {
        it("Check all maximum days on each month in 2019", () => {
            const testCase = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            for (let i = 0; i < testCase.length; i++) {
                const max = cldr.getMaxDay(i, 2019);
                assert.equal(max, testCase[i]);
            }
        });

        it("Maximum day in February of leap year is 29", () => {
            const max = cldr.getMaxDay(1, 2020);
            assert.equal(max, 29);
        });
    });

    describe("#makeKeyboard", () => {
        it("Prefix can't contains '-' character", () => {
            try {
                cldr.makeKeyboard("Pre-fix", "text");
                cldr.makeKeyboard("-Prefix", "text");
                cldr.makeKeyboard("Prefix-", "text");
            } catch (error) {
                assert.equal(error.message, "Invalid callback format!");
            }
        });

        it("Prefix and Text can't contains '-' character", () => {
            try {
                cldr.makeKeyboard("Prefix", "-text");
                cldr.makeKeyboard("-Prefix", "text");
                cldr.makeKeyboard("Prefix-", "te-xt");
            } catch (error) {
                assert.equal(error.message, "Invalid callback format!");
            }
        });

        it("Prefix, Text, and Action can't contains '-' character", () => {
            try {
                cldr.makeKeyboard("Pre-fix", "-text", "action");
                cldr.makeKeyboard("-Prefix", "text", "act-tion");
                cldr.makeKeyboard("Prefix", "te-xt", "-action");
                cldr.makeKeyboard("-Prefix", "te-xt", "act-tion");
            } catch (error) {
                assert.equal(error.message, "Invalid callback format!");
            }
        });

        it("Args can't prefix by '-' character", () => {
            try {
                cldr.makeKeyboard("Prefix", "text", "action", "-args");
                cldr.makeKeyboard("Prefix", "text", "action", "---args");
            } catch (error) {
                assert.equal(error.message, "args cannot prefix by '-'!");
            }
        });

        it("True format should be has both 'text' and 'calback_data' properties!", () => {
            const format = cldr.makeKeyboard(
                "prefix",
                "text",
                "action",
                "args"
            );
            assert.equal(format.text, "text");
            assert.equal(format.callback_data, "prefix-action-args");
        });
    });

    describe("#createArgs", () => {
        it("All parameter should be integer", () => {
            try {
                cldr.createArgs(1, 2, 3, 4, "a");
            } catch (error) {
                assert.equal(
                    error.message,
                    "createArgs's params must be integer."
                );
            }

            const args = cldr.createArgs(1, 2, 3, 4, 5);
            assert.equal(args.includes("@"), true);
        });

        it("Day should be positive integer", () => {
            try {
                cldr.createArgs(-1, 2, 3, 4, 5);
            } catch (error) {
                assert.equal(error.message, "Day must be positive integer.");
            }
        });
    });

    describe("#parseArgs", () => {
        it("Args must be match to this pattern `/(([0-9]+)@){4,}[0-9]+/`.", () => {
            try {
                cldr.parseArgs("1@2@3");
                cldr.parseArgs("1@2@3@c@5");
                cldr.parseArgs("1@2@3@4@");
            } catch (error) {
                assert.equal(
                    error.message,
                    "Invalid Args format. Args must be match to this pattern `/(([0-9]+)@){4,}[0-9]+/`."
                );
            }
        });

        describe("Args '21@10@2019@0@0' is valid and : ", () => {
            const { day, month, year, row, col } = cldr.parseArgs(
                "21@10@2019@0@0"
            );
            it("Day should be 21", () => {
                assert.equal(day, 21);
            });
            it("Month should be 10", () => {
                assert.equal(month, 10);
            });
            it("Year should be 2019", () => {
                assert.equal(year, 2019);
            });
            it("Row should be 0", () => {
                assert.equal(row, 0);
            });
            it("Col should be 0", () => {
                assert.equal(col, 0);
            });
        });
    });

    describe("#isWeekend", () => {
        it("6 July 2019 and 7 July 2019 is weekend", () => {
            const bool =
                cldr.isWeekend(6, 6, 2019) && cldr.isWeekend(7, 6, 2019);
            assert.equal(bool, true);
        });

        it("8 July 2019 is not weekend", () => {
            const bool = cldr.isWeekend(8, 6, 2019);
            assert.equal(bool, false);
        });
    });

    describe("#fitMonth", () => {
        it("if this month is JANUARY previous month should be DECEMBER", () => {
            const prev = cldr.fitMonth(0);
            assert.equal(prev, 11);
        });
        it("if this month is DECEMBER next month should be JANUARY", () => {
            const next = cldr.fitMonth(11, "next");
            assert.equal(next, 0);
        });
    });

    describe("#threeStateTogge", () => {
        it("for count = 2 then return 2 checks", () => {
            const res = cldr.threeStateTogge("20", 2);
            assert.equal(res, "🗸🗸");
        });
        it("for count = 1 then return 1 check + original text", () => {
            const res = cldr.threeStateTogge("21", 1);
            assert.equal(res, "🗸21");
        });
        it("for count not 1 or 2 then return original text", () => {
            const res = cldr.threeStateTogge("20", 0);
            assert.equal(res, "20");
        });
    });

    describe("#makeHeader", () => {
        it("for month <= current month : prevButton text should be 'x'", () => {
            const [prev, title, next] = cldr.makeHeader("prefix", 6, 2019, 6);
            assert.equal(prev.text, "x");
        });
        it("for month > current month : prevButton text should be '<<' ", () => {
            const [prev, title, next] = cldr.makeHeader("prefix", 7, 2019, 6);
            assert.equal(prev.text, "<<");
        });
    });

    describe("#countDay", () => {
        it("22 July 2019 - 22 July 2019 = 1 day.", () => {
            const day = cldr.countDay(
                new Date(2019, 6, 22),
                new Date(2019, 6, 22)
            );
            assert.equal(day, 1);
        });
        it("22 July 2019 - 26 July 2019 = 5 days.", () => {
            const day = cldr.countDay(
                new Date(2019, 6, 22),
                new Date(2019, 6, 26)
            );
            assert.equal(day, 5);
        });
        it("26 July 2019 - 29 July 2019 = 4 days. (Weekend included)", () => {
            const day = cldr.countDay(
                new Date(2019, 6, 26),
                new Date(2019, 6, 29),
                false
            );
            assert.equal(day, 4);
        });
        it("26 July 2019 - 29 July 2019 = 2 days. (Weekend not included)", () => {
            const day = cldr.countDay(
                new Date(2019, 6, 26),
                new Date(2019, 6, 29)
            );
            assert.equal(day, 2);
        });
        it("31 July 2019 - 1 Agustus 2019 = 2 days.", () => {
            const day = cldr.countDay(
                new Date(2019, 6, 31),
                new Date(2019, 7, 1)
            );
            assert.equal(day, 2);
        });
        it("1 Agtustus 2019 - 31 July 2019 = 2 days.", () => {
            const day = cldr.countDay(
                new Date(2019, 7, 1),
                new Date(2019, 6, 31)
            );
            assert.equal(day, 2);
        });
    });

    describe("#CalendarKeyboard", () => {
        const { CalendarKeyboard } = cldr;
        const calendar = new CalendarKeyboard("CalendarKeyboard@1", 1);
        calendar.date = new Date(2019, 6, 10);

        describe("#switchAction", () => {
            it("for given day < current day in the same month should be has message='-' and action='noaction'.", () => {
                const res = calendar.switchAction(8, 6, 2019, "onSelect");
                assert.equal(res.message, "-");
                assert.equal(res.action, "noaction");
            });

            it("for given day is weekend should be has message='x' and action='noaction'", () => {
                const res = calendar.switchAction(7, 6, 2019, "onSelect");
                assert.equal(res.message, "x");
                assert.equal(res.action, "noaction");
            });

            it("for given action='noaction' should be has message='-' and action='noaction'", () => {
                const res = calendar.switchAction(7, 6, 2019, "noaction");
                assert.equal(res.message, "-");
                assert.equal(res.action, "noaction");
            });

            it("for given day is available should be has message= day and action= given action", () => {
                const res = calendar.switchAction(22, 6, 2019, "onSelect");
                assert.equal(res.message, 22);
                assert.equal(res.action, "onSelect");
            });
        });
    });
});
