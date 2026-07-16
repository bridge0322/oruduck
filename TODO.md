# TODO（スコープ外で気づいた改善点の置き場）

- app.js が 1.18MB（gzip 207KB）。code-splitting は未着手（rolldown の
  codeSplitting オプションで改善余地）。
- OCR取り込み（ImportSheet）は実スクショで精度不足のまま保留中。口数×基準価額
  モードが実質の置き換え。
- オルコギへの機能移植が大きく遅れている（sleep collection 以降の全機能）。
