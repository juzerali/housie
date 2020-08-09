function generateTicket() {
    const colmap = {
        0: 'a',
        1: 'b',
        2: 'c',
    };
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j < 3; j++) {
           document.getElementById(colmap[j] + i).innerText = "";
        }
    }
    const engine = new Random();

    let columns = [
        /* 0 */    [1,2,3,4,5,6,7,8,9],
        /* 1 */    [10,11,12,13,14,15,16,17,18,19],
        /* 2 */    [20,21,22,23,24,25,26,27,28,29],
        /* 3 */    [30,31,32,33,34,35,36,37,38,39],
        /* 4 */    [40,41,42,43,44,45,46,47,48,49],
        /* 5 */    [50,51,52,53,54,55,56,57,58,59],
        /* 6 */    [60,61,62,63,64,65,66,67,68,69],
        /* 7 */    [70,71,72,73,74,75,76,77,78,79],
        /* 8 */    [80,81,82,83,84,85,86,87,88,89, 90]

    ];

    const ticket = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const columnIndexes = [0,1,2,3,4,5,6,7,8];
    /**
     * Choose mandatory first number for each column
     **/
    const firstRowIndexes = engine.sample(columnIndexes, 5).sort();
    const secondRowIndexes = engine.sample(columnIndexes, 5).sort();

    let thirdRowEmptyColumns = _.difference(columnIndexes, _.union(firstRowIndexes, secondRowIndexes)).sort();
    let thirdRowRemainingColumns = _.difference(columnIndexes, thirdRowEmptyColumns);
    let remainingThirdRowColumns = engine.sample(thirdRowRemainingColumns, 5 - thirdRowEmptyColumns.length)

    const thirdRowIndexes = _.union(thirdRowEmptyColumns, remainingThirdRowColumns).sort();

    firstRowIndexes.forEach((i) => ticket[0][i] = true);
    secondRowIndexes.forEach((i) => ticket[1][i] = true);
    thirdRowIndexes.forEach((i) => ticket[2][i] = true);

    for (let i = 0; i <= 8; i++) {
        let numRequired = 0;
        for (let j = 0; j < 3; j++) {
            if(ticket[j][i]) numRequired++;
        }
        console.assert(numRequired > 0);

        let columnsNumbers = engine.sample(columns[i], numRequired).sort();

        for (let k = 0; k < 3; k++) {
            if(ticket[k][i]) ticket[k][i] = columnsNumbers.shift();
        }
    }

    console.log(ticket);
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j < 3; j++) {
            if (ticket[j][i]) document.getElementById(colmap[j] + i).innerText = ticket[j][i];
        }
    }
}

