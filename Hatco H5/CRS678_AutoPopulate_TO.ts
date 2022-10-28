/**
** Auto populate To Schedule Number whenever From Schedule Number is filled
**
** Developed By: SuriyaN@fortude.co
** Date: 2022-04-27
**
**/

class CRS678_AutoPopulate_TO { /** * Script initialization function. */
    private scriptName = "CRS678_AutoPopulate_TO";
    private controller: IInstanceController;
    private log: IScriptLog;
    private args: string;
    private orderTypeArray;
    private $host: JQuery;

    constructor(scriptArgs: IScriptArgs) {
        this.log = scriptArgs.log;
        this.args = scriptArgs.args;
        this.controller = scriptArgs.controller;
        this.$host = this.controller.ParentWindow;
    }
    public static Init(args: IScriptArgs): void {
        new CRS678_AutoPopulate_TO(args).run();
    }
    public run(): void {
        jQuery('#WFSCHN').on('input', function () {
            var WFSCHN = ScriptUtil.GetFieldValue("WFSCHN");
            ScriptUtil.SetFieldValue("WTSCHN", WFSCHN);
        });
    }


   

}