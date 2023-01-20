class MWS410_AddColoumns { /** * Script initialization function. */
    private controller: IInstanceController;
    private log: IScriptLog;
    private args: string;
    private csrfToken = '';
    private csrfTimestamp = 0;
    private csrfTimeout = 30000;
    private unsubscribeReqCompleted;
    private ColumnName: Array<string> = [];
    private M3FieldsNames: Array<string> = [];
    private M3Values: Array<string> = [];
    private ColumnNumber: Array<number> = [];
    private view: string = "";
    private al: Array<string> = [];
    private locations: Array<string> = [];
    private allocatable: boolean = false;
    private CONO = 0;
    private DIVI = "";

    constructor(scriptArgs: IScriptArgs) {
        this.log = scriptArgs.log;
        this.args = scriptArgs.args;
        this.controller = scriptArgs.controller;
    }
    public static Init(args: IScriptArgs): void {
        new MWS410_AddColoumns(args).run();
    }
    public run(): void {
        this.ColumnName = ["TOTAL AMOUNT", "MFG"];
        this.M3FieldsNames = ["V_TOTA", "MFG"];
        var RIDN = ScriptUtil.GetFieldValue("WWRIDN");
        this.CONO = Number(ScriptUtil.GetFieldValue("CONO"))
        this.DIVI = ScriptUtil.GetFieldValue("DIVI")

        this.getLocations(RIDN);
        const list = this.controller.GetGrid();

        let mySortingOrder = this.controller.GetSortingOrder();
        this.view = this.controller.GetView();

        for (let col of this.ColumnName) {
            const stdtColumnNum = list.getColumns().length + 1;
            this.appendColumn(list, stdtColumnNum, col);
            this.ColumnNumber.push(stdtColumnNum);
        }
        var RIDN = ScriptUtil.GetFieldValue("WWRIDN");
        this.callBulkApi();
        this.attachEvents(this.controller);
    }
    private async callBulkApi(): Promise<{}> {
        let records = await this.generateRequest();
        var token = await this.getValidToken();
        return new Promise((resolve, reject) => {
            fetch('/m3api-rest/v2/execute', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-type': 'application/json',
                    'fnd-csrf-token': this.csrfToken
                },
                body: (records)
            })
                .then((response) => {
                    response.json().then((data) => {
                        resolve(JSON.stringify(data));
                        this.formatJSON(JSON.stringify(data));
                    })
                })
                .catch((error) => {
                    console.log("Error: " + error);
                    reject(error)
                })
        })
    }

    private async getValidToken() {
        return new Promise((resolve, reject) => {
            var now = new Date().getTime()
            if (this.csrfTimestamp + this.csrfTimeout > now) {

                resolve(this.csrfToken)
            } else {
                fetch('/m3api-rest/csrf').then((resp) => {
                    resp.text().then((token) => {
                        this.csrfToken = token
                        this.csrfTimestamp = now
                        resolve(this.csrfToken)
                    })
                }).catch(err => {
                    reject(err)
                })
            }
        })
    }

    private async formatJSON(bulkResponse) {
        this.al = [];
        let json = JSON.parse(bulkResponse);
        for (var i = 0; i < json.results.length; i++) {
            try {
                this.allocatable = false;
                var total = json.results[i].records[0].V_TOTA;
                var WHLO = json.results[i].records[0].MHWHLO;
                await this.checkAllocatable(WHLO);
                console.log(" Locations Length: " + this.locations.length + " Allocatable: " + this.allocatable);
                if (total === undefined) {
                    total = 0.0;
                }
                if (this.allocatable) {
                    this.al.push(total + "|" + "*");
                }
                else {
                    this.al.push(total + "| ");
                }
            } catch (Exception) {
                console.log("Error in getting the fields");
            }
        }
        this.populateData();
    }

    private async checkAllocatable(warehouse) {
        console.log("CheckAllocatable");
        return new Promise((resolve, reject) => {
            const list = this.controller.GetGrid();
            if (this.locations.length > 0) {
                for (var i = 0; i < this.locations.length; i++) {
                    const myRequest = new MIRequest();
                    myRequest.program = "MMS010MI";
                    myRequest.transaction = "GetLocation";
                    myRequest.outputFields = ["ALOC"];
                    myRequest.record = { WHLO: warehouse, WHSL: this.locations[i] };
                    console.log("WHLO: " + warehouse + " Location: " + this.locations[i]);
                    MIService.Current.executeRequest(myRequest).then((response: IMIResponse) => {
                        {
                            console.log("Success Response: " + response);
                            for (let item of response.items) {
                                console.log("Allocatable Item: " + item.ALOC);
                                if (item.ALOC == "0") {
                                    this.allocatable = true;
                                }
                            }
                            resolve(this.allocatable);
                        }
                    }).catch((response: IMIResponse) => {
                        console.log("Error: " + response.errorMessage);
                        this.allocatable = false;
                        reject(response);
                    });
                }

            }
            else {
                resolve(this.allocatable);
            }
        });
    }

    private getLocations(RIDN) {
        console.log("In Get Locations: " +RIDN);
        const myRequest = new MIRequest();
        myRequest.program = "EXPORTMI";
        myRequest.transaction = "SelectPad";
        myRequest.outputFields = ["REPL"];
        myRequest.record = { QERY: "MQWHSL from MITALO where MQRIDN = '" + RIDN + "'" };
        console.log("MQWHSL from MITALO where MQRIDN = '" + RIDN + "'");
        MIService.Current.executeRequest(myRequest).then((response: IMIResponse) => {
            {
                for (let item of response.items) {
                    console.log("Locations: " + item.REPL);
                    this.locations.push(item.REPL);
                }

            }
        }).catch((response: IMIResponse) => {
            console.log("Error: " + response);
            this.locations.push(" ");
        });

    }

    private populateData() {
        const list = this.controller.GetGrid();
        const columnNum = list.getColumns().length - 1;
        const columnId = "C" + columnNum;
        const columnUser = list.getColumns().length;
        const columnIdUser = "C" + columnUser;
        for (let i = 0; i < list.getData().getLength(); i++) {
            try {
                let newData = {};
                newData[columnId] = this.al[i].split("|")[0];
                newData["id_" + columnId] = "R" + (i + 1) + columnId;
                $.extend(list.getData().getItem(i), newData);
                newData = {};
                newData[columnIdUser] = this.al[i].split("|")[1];
                newData["id_" + columnIdUser] = "R" + (i + 1) + columnIdUser;
                $.extend(list.getData().getItem(i), newData);
            } catch (Exception) {
            }

        }
        let columns = list.getColumns(); list.setColumns(columns);
        this.showWaitCursor(false);
        this.attachEvents(this.controller);
        console.log("Completed Populating");
    }

    private generateRequest() {
        const list = this.controller.GetGrid();
        const customColumnNum = list.getColumns().length + 1;
        var col = list.getData().getLength();
        let columnIdDeliveryNumber = "C";
        let columnIdInvoiceDate = "C";
        var RIDN = ScriptUtil.GetFieldValue("WWRIDN");
        for (let i = 0; i < list.getColumns().length; i++) {
            let col = list.getColumns()[i].filterFld;
            if (col == "DLIX") {
                columnIdDeliveryNumber = list.getColumns()[i].field
                break;
            }
        }

        var records = `{
        "program": "CMS100MI",
        "cono": `+this.CONO+`,
            "divi": "`+ this.DIVI +`",
                "excludeEmptyValues": false,
                    "rightTrim": true,
                        "maxReturnedRecords": 0,
                            "transactions": [`;
        for (var i = 0; i < col; i++) {
            records = records + ` {
                                    "transaction": "Lst_MWS410_Tota",
                                    "record": {
                                        "URDLIX": "`+ list.getData().getItem(i)[columnIdDeliveryNumber] + `"
                                    },
                                    "selectedColumns": [
                                        "V_TOTA","MHWHLO"
                                    ]
                                },`;

        }
        records = records.substring(0, records.length - 1) + `]}`;
        console.log(records)
        return records;

    }
    private attachEvents(controller: IInstanceController) {

        this.unsubscribeReqCompleted = controller.RequestCompleted.On((e) => {
            //Populate additional data on scroll
            if (e.commandType === "PAGE" && e.commandValue === "DOWN") {
                this.detachEvents();
                this.showWaitCursor(true);
                this.callBulkApi();
            }
            else if (e.commandType === "KEY" && e.commandValue === "ENTER") {
                // this.rowIndex = 0;
                this.detachEvents();
                this.showWaitCursor(true);
                this.callBulkApi();
            }
            else {
                this.detachEvents();
            }
        });

    }

    private showWaitCursor(isWait: boolean): void {
        if (isWait) {
            $("body").css("cursor", "wait");
        } else {
            $("body").css("cursor", "default");
        }
    }

    private appendColumn(list: IActiveGrid, columnNum: number, columnHeaderName: string) {
        const columnId = "C" + columnNum;

        let columns = list.getColumns();
        let newColumn = {
            id: columnId,
            field: columnId,
            name: columnHeaderName,
            width: 150,
        }
        if (columns.length < columnNum) {
            columns.push(newColumn);
        }
        list.setColumns(columns);
    }

    private detachEvents() {
        this.unsubscribeReqCompleted();
    }
    private convertDate(date: string): string {
        let YYyymmdd = "";
        var YY = "20";
        let dateFormat = ScriptUtil.GetUserContext("DTFM");
        try {
            if (dateFormat == "DMY") {
                YYyymmdd = YY + date.substring(4, 6) + date.substring(2, 4) + date.substring(0, 2);
            }

            if (dateFormat == "MDY") {
                YYyymmdd = YY + date.substring(4, 6) + date.substring(0, 2) + date.substring(2, 4);
            }

            if (dateFormat == "YMD") {
                YYyymmdd = YY + date.substring(0, 2) + date.substring(2, 4) + date.substring(4, 6);
            }
        } catch
        {
            YYyymmdd = "";
        }
        return YYyymmdd;
    }
}
