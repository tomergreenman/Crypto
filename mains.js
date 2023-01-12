/// <reference path="jquery-3.6.0.js" />

$(() => {

    load();
    let allCoins = [];
    const checkedCoins = new Set();
    let coin6Symbol = "";

    $("#popUp").hide();
    $("#noCoins").hide();
    $("section").hide();
    $("#homeSection").show();

    $("a").on("click", function () {
        const dataSection = $(this).attr("data-section");
        $("section").hide();
        $("#" + dataSection).show();
    })

    // Get Any API Data
    function getJSON(url) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url,
                success: data => { resolve(data); },
                error: err => { reject(err.statusText + "\nData Not Found \nYou May Have Internet Problems") }
            })
        })
    }

    // Get Coins Data And Display + Clear Local Storage On Page Load
    async function load() {
        try {
            localStorage.clear();
            const spinnerDiv = spinner();
            $("#cardsDiv").html(spinnerDiv);
            allCoins = await getJSON("https://api.coingecko.com/api/v3/coins");
            displayCoins(allCoins);
        }
        catch (err) {
            alert(err);
            $("#homeSection").html(`<h2>Something Went Wrong...</h2>`);
        }
    }

    // Display Coins (All Coins or Searched Coins)
    function displayCoins(coins) {
        let allCards = "";
        for (const coin of coins) {
            const card = createCard(coin);
            allCards += card;
        }
        $("#cardsDiv").html(allCards);
        $(".infoDiv").hide();
    }

    // Create Single Coin Card
    function createCard(coin) {
        const card = `
        <div class="card col-12">
            <div class="form-check form-switch">
                <input class="${coin.symbol} form-check-input" type="checkbox" role="switch" data-checkbox-symbol="${coin.symbol}"/>
            </div>
            <img src="${coin.image.thumb}" class="card-img-top w-25">
            <div class="card-body">
                <h4 class="card-title">${coin.symbol}</h4>
                <p class="card-text">${coin.name}</p>
                <button id="${coin.id}" class="infoButton btn btn-dark text-success fw-bold">More Info</button>
                <div class="infoDiv"></div>
            </div>
        </div>`;
        return card;
    }

    // Get Coin Prices
    function getCoinPrices(coin) {
        const usd = coin.market_data.current_price.usd.toFixed(2);
        const eur = coin.market_data.current_price.eur.toFixed(2);
        const ils = coin.market_data.current_price.ils.toFixed(2);
        const coinPrices = {  usd, eur, ils };
        return coinPrices;
    }

    //Display And Hide More Info
    $("#homeSection").on("click", ".card button", async function () {
        const infoDiv = $(this).next();
        try {
            if ($(this).text() === "Less Info") {
                infoDiv.slideUp(1000);
                $(this).text("More Info");
                return;
            }

            if (localStorage.getItem(this.id)?.length) {
                const content = localStorage.getItem(this.id)
                infoDiv.html(content).slideDown(1000); // display previous coin prices if coin still in local storage countdown
                $(this).text("Less Info");
                return;
            }

            const spinnerDiv = spinner();
            infoDiv.html(spinnerDiv).show();
            const coin = await getJSON(`https://api.coingecko.com/api/v3/coins/${this.id}`);
            const coinPrices = getCoinPrices(coin);
            const content = `
            <br>
            USD &#36; ${coinPrices.usd} <br>
            EUR &#8364; ${coinPrices.eur} <br>
            ILS &#8362; ${coinPrices.ils}
            `;
            infoDiv.hide(); // hide spinner before sliding down coin prices
            infoDiv.html(content).slideDown(1000);
            $(this).text("Less Info");
            localStorage.setItem(this.id, content);
            setTimeout(() => {
                localStorage.setItem(this.id, "");
            }, 120000); // save coin info for 2 minutes by setting countdown in local storage
        }
        catch (err) {
            alert("Could Not Load Additional Info");
            infoDiv.html("");
        }
    });

    // Search 
    $("#searchButton").on("click", function () {
        const textToSearch = $("input[type=search]").val().toLowerCase();

        //validation with no alerts not to interfere with timeout's and intervals
        if (textToSearch === "") {
            $("input[type=search]").attr("placeholder", "Enter Field");
            $("input[type=search]").css("background-color", "lightcoral");
            $("input[type=search]").css("font-weight", "bold");
            return;
        }

        restyleSearch();
        clearInterval(intervalId);
        const filteredCoins = allCoins.filter(coin => coin.symbol.includes(textToSearch));
        if (filteredCoins.length === 0) {
            $("section").hide();
            $("#cardsDiv").html("");
            $("#noCoins").show();
            $("#homeSection").show();
            return;
        }

        $("#noCoins").hide();
        displayCoins(filteredCoins);
        $("section").hide();
        for (const symbol of checkedCoins.keys()) {
            $(`.${symbol}`).prop("checked", true);
        }
        $("#homeSection").show();
    });

    // Restyle Search input
    function restyleSearch() {
        $("input[type=search]").attr("placeholder", "Search Coin/s");
        $("input[type=search]").css("background-color", "");
        $("input[type=search]").css("font-weight", "");
    }

    // All Coins Button / Home Button
    $("#allCoinsButton, #homeButton").on("click", () => {
        $("#noCoins").hide();
        displayCoins(allCoins);
        $("input[type=search]").val("");
        $("section").hide();
        for (const symbol of checkedCoins.keys()) {
            $(`.${symbol}`).prop("checked", true);
        }
        $("#homeSection").show();
    })

    // Clear Filtered Coins Button
    $("#clearSelectedButton").on("click", () => {
        checkedCoins.clear();
        $("input[type=checkbox]").prop("checked", false);
        if ($("#liveReportsSection").is(':visible')) {
            $("section").hide();
            displayCoins(allCoins);
            $("#homeSection").show();
        }
    })

    // Check Box Selected Coins 
    $("#homeSection").on("change", "input[type=checkbox]", function () {
            const symbol = $(this).attr("data-checkbox-symbol");
            if (checkedCoins.size === 5) {
                if ($(this).prop("checked") === true) {
                    coin6Symbol = symbol;
                    $(this).prop("checked", false);
                    const filteredCoins = allCoins.filter(coin => checkedCoins.has(coin.symbol));
                    popUp(filteredCoins);
                    $("#cardsDiv .card, #navBar").css("pointer-events", "none");
                    return;
                }
            }

            if ($(this).prop("checked") === true) {
                $(`.${symbol}`).prop("checked", true)
                checkedCoins.add(symbol);
                return;
            }

            $(`.${symbol}`).prop("checked", false);
            checkedCoins.delete(symbol);
    });

    // Cancel Button Function (Leave All Checked Cards As Before) 
    $("#cancel").on("click", async () => {
        const popUpCards = document.getElementsByClassName("check-popUp");
        for (const popUpCard of popUpCards) {
            const symbol = popUpCard.getAttribute("data-checkbox-symbol");
            checkedCoins.add(symbol);
            $(`.${symbol}`).prop("checked", true);
        }
        $("#popUp").hide();
        $("#cardsDiv .card, #navBar").css("pointer-events", "");
    });

    // OK Button Function (Swap Checked Cards)
    $("#ok").on("click", async () => {
        if (checkedCoins.size === 5) {
            alert("Please Unselect At Least One Coin");
            return;
        }
        $(`.${coin6Symbol}`).prop("checked", true);
        $("#popUp").hide();
        checkedCoins.add(coin6Symbol);
        $("#cardsDiv .card, #navBar").css("pointer-events", "");
    });

    //Pop Up 
    function popUp(coins) {
        let allCards = "";
        for (const coin of coins) {
            const card = createPopUpCard(coin)
            allCards += card;
        }
        $("#popUpCards").html(allCards);
        $("#popUp").show();
    }

    //Get Single PopUp Card
    function createPopUpCard(coin) {
        const card = `
    <div class="card col">
        <div class="form-check form-switch">
            <input class="${coin.symbol} form-check-input check-popUp" type="checkbox" role="switch" data-checkbox-symbol="${coin.symbol}" checked/>
        </div>
        <img src="${coin.image.thumb}" class="card-img-top w-25">
        <div class="card-body">
            <h4 class="card-title">${coin.symbol}</h4>
            <p class="card-text">${coin.name}</p>
        </div>
    </div>`;
        return card;
    };

    // Create Parallax Header
    const parallax = document.getElementById("header");
    window.addEventListener("scroll", function () {
        let offset = window.pageYOffset;
        parallax.style.backgroundPositionY = offset * 0.5 + "px"
    });

    // Create Spinner Div
    function spinner() {
        const spinnerDiv = `
            <br>
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only"></span>
            </div>`;
        return spinnerDiv;
    }

    // Live Report
    let intervalId;
    $("#liveReportsButton").on("click", async function () {
        try {
            clearInterval(intervalId);
            if (checkedCoins.size === 0) {
                $("#chartContainer").html("<h2>No Coins Selected</h2>");
                return;
            }

            $("#reportsSpinner").html(spinner())
            const dataPoints = [];
            const coins = [];
            let coinsString = "";

            for (const key of checkedCoins.keys()) {
                const coin = key.toUpperCase();
                coins.push(coin);
            }

            for (let i = 0; i <= coins.length - 1; i++) {
                coinsString += coins[i] + ",";
            }

            const allCoinsData = [];
            for (let i = 0; i <= coins.length - 1; i++) {
                dataPoints.push([]);
                const coinData = {
                    type: "line",
                    xValueType: "dateTime",
                    yValueFormatString: "###.00$",
                    xValueFormatString: "hh:mm:ss TT",
                    showInLegend: true,
                    name: `${coins[i]}`,
                    dataPoints: dataPoints[i]
                }
                allCoinsData.push(coinData);
            }

            const options = {
                height: 500,
                backgroundColor: "transparent",
                title: {
                    text: "Coins TO USD"
                },
                axisX: {
                    title: "chart updates every 2 secs"
                },
                axisY: {
                    title: "Coins Value",
                    prefix: "$"
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    cursor: "pointer",
                    verticalAlign: "top",
                    fontSize: 22,
                    fontColor: "dimGrey",
                    itemclick: toggleDataSeries
                },
                dataPointWidth: 50,
                data: allCoinsData
            };

            $("#chartContainer").CanvasJSChart(options);

            function toggleDataSeries(e) {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                }
                else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }

            const updateInterval = 2000;

            // initial value
            const yValues = [];
            var time = new Date;

            async function updateChart() {
                try {
                    time.setTime(time.getTime() + updateInterval);
                    const coinsUsdPrices = await getJSON(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinsString}&tsyms=USD`);
                    $("#reportsSpinner").html("");

                    for (let i = 0; i <= coins.length - 1; i++) {
                        yValues[i] = coinsUsdPrices[`${coins[i]}`].USD;
                        dataPoints[i].push({
                            x: time.getTime(),
                            y: yValues[i]
                        })
                    }

                    $("#chartContainer").CanvasJSChart().render();
                }
                catch (err) {
                    alert("Data Not Found \nYou May Have Internet Problems");
                    clearInterval(intervalId);
                    $("#chartContainer").html(`<h2>Something Went Wrong</h2>`);
                }
            }

            // generates first set of dataPoints 
            updateChart();
            const intervalId = setInterval(function () { updateChart() }, updateInterval);
        }

        catch (err) {
            alert("Data Not Found \nYou May Have Internet Problems");
        }

    });

    $(".killTimer").on("click", () => {
        clearInterval(intervalId);
    });

    $("a, .killTimer").on("click", () => {
        restyleSearch();
    });

});





