class ARS141_FillReportText { /** * Script initialization function. */
    private controller: IInstanceController;
    private log: IScriptLog;
    private args: string;
    private orderTypeArray;
    private detachRequesting: Function;
    private detachRequested: Function;
    constructor(scriptArgs: IScriptArgs) {
        this.log = scriptArgs.log;
        this.args = scriptArgs.args;
        this.controller = scriptArgs.controller;
    }
    public static Init(args: IScriptArgs): void {
        new ARS141_FillReportText(args).run();
    }
    public run(): void {
        ScriptUtil.SetFieldValue("WWLITX", "");
        console.log("LITX: " + ScriptUtil.GetFieldValue("WWLITX"))
        this.attachEvents(this.controller);
        jQuery('#WFCUCL').on('input', function () {
            var WFCUCL = ScriptUtil.GetFieldValue("WFCUCL")+"";
            var WTCUCL = ScriptUtil.GetFieldValue("WTCUCL")+"";
            var combined = WFCUCL + WTCUCL+"";
            ScriptUtil.SetFieldValue("WWLITX", combined.toUpperCase() + "");

        });
        jQuery('#WTCUCL').on('input', function () {
            var WFCUCL = ScriptUtil.GetFieldValue("WFCUCL");
            var WTCUCL = ScriptUtil.GetFieldValue("WTCUCL");
            var combined = WFCUCL + WTCUCL + "";
            ScriptUtil.SetFieldValue("WWLITX", combined.toUpperCase() + "");
            ScriptUtil.SetFieldValue("WWLITX", combined.toUpperCase() + "");
        });
        jQuery('#WWLITX').on('input', function () {
            ScriptUtil.SetFieldValue("WWLITX",  "");
        });
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
    private onRequesting(e: CancelRequestEventArgs): void {
        var WFCUCL = ScriptUtil.GetFieldValue("WFCUCL");
        var WTCUCL = ScriptUtil.GetFieldValue("WTCUCL");
       
        if (e.commandValue == "ENTER" && (WFCUCL || WTCUCL)) {
            if (!WFCUCL) {
                WFCUCL = "   ";
            }
            var combined = WFCUCL + WTCUCL + "";
            console.log("Enter combined: " + combined)
            ScriptUtil.SetFieldValue("WWLITX", combined.toUpperCase() + "");
            ScriptUtil.SetFieldValue("WFCUCL", "");
            ScriptUtil.SetFieldValue("WTCUCL", "");
           
            console.log("LOG: " + ScriptUtil.GetFieldValue("WWLITX").length);

            if (ScriptUtil.GetFieldValue("WWLITX").length > 6) {
                ConfirmDialog.ShowMessageDialog({
                    header: "Error",
                    message: "Incorrect Report Text Format. Please check Customer Group",
                    dialogType: "Error"
                });
                e.cancel = true;
            }
          //  this.controller.PressKey("ENTER");
            console.log("THIS: " + ScriptUtil.GetFieldValue("WWLITX"));
        }
    }

    private onRequested(args: RequestEventArgs): void {
        console.log("Requested");
        this.detachEvents();
    }
}