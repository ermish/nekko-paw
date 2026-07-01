; Custom NSIS hooks for the Open Paw installer/uninstaller.
;
; On uninstall, offer to also remove the user's data (chats, settings, models
; config) which lives in %APPDATA%\Open Paw. `/SD IDNO` makes silent uninstalls
;, including the one electron-updater runs during an auto-update, default to
; "No", so updates never wipe a user's data.

!macro customUnInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "Also delete your Open Paw chats, settings, and local data?$\n$\nChoose No to keep them for a future reinstall." /SD IDNO IDYES OpPawDeleteData
    Goto OpPawKeepData
  OpPawDeleteData:
    RMDir /r "$APPDATA\Open Paw"
  OpPawKeepData:
!macroend
