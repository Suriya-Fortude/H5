class ValidateMMS100_Orders {
    private scriptName = "ValidateMMS100_Orders";
    private controller: IInstanceController;
    private log: IScriptLog;
    private args: string;
    private detachRequesting: Function;
    private detachRequested: Function;
    private IsStatus99Found = false;
    constructor(scriptArgs: IScriptArgs) {
        this.controller = scriptArgs.controller;
        this.log = scriptArgs.log;
        this.args = scriptArgs.args;
    }
    private logEvent(eventName: string, args: RequestEventArgs): void {
        this.log.Info("Event: " + eventName + " Command type: " + args.commandType + " Command value: " + args.commandValue);
    }
    private detachEvents(): void {
        this.detachRequesting();
        this.detachRequested();
    }
    private attachEvents(controller: IInstanceController): void {
        this.detachRequesting = controller.Requesting.On((e) => {
            this.onRequesting(e);
        });
        this.detachRequested = controller.Requested.On((e) => {
            this.onRequested(e);
        });
    }
    private ValidateStatus(): void {
        var MRTRSLColumn = ListControl.ListView.GetValueByColumnName("TRSL");
        var MRTRSHColumn = ListControl.ListView.GetValueByColumnName("TRSH");
        if (MRTRSLColumn.length > 0) {
            for (var i = 0; i < MRTRSLColumn.length; i++) {
                if (MRTRSLColumn[i] == ("99")) {
                    this.IsStatus99Found = true;
                } else {
                    this.IsStatus99Found = false;
                }
            }
        } else if (MRTRSHColumn.length > 0) {
            for (var i = 0; i < MRTRSHColumn.length; i++) {
                if (MRTRSHColumn[i] == ("99")) {
                    this.IsStatus99Found = true;
                } else {
                    this.IsStatus99Found = false;
                }
            }
        }
    }
    private onRequesting(e: CancelRequestEventArgs): void {
        let myProgramName = this.controller.GetProgramName();
        let myPanelName = this.controller.GetPanelName();
        if (e.commandType == "LSTOPT" && (myProgramName == "MMS100" || myProgramName == "MMS101") && (myPanelName == "MMA100BC" || myPanelName == "MMA101BC")) {
            if (e.commandValue == '11' || e.commandValue == '2') {
                this.ValidateStatus();
                if (this.IsStatus99Found) {
                    ConfirmDialog.ShowMessageDialog({
                        header: "Error",
                        message: "Can not ADD Lines as status is 99",
                        dialogType: "Error"
                    });
                    e.cancel = true;
                } else {

                    e.cancel = false;
                }
            }
        }

    }
    private onRequested(args: RequestEventArgs): void {
        this.detachEvents();
    }
    public run(): void {
        this.log.Info("Running...");
        this.attachEvents(this.controller);
    } /** * Script initialization function. */
    public static Init(args: IScriptArgs): void {
        new ValidateMMS100_Orders(args).run();
    }
}
