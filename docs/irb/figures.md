# IRB 送審圖片索引（Figure index for the IRB packet）

Participant-facing screens after the IRB revisions (REQ-409.4), in the order participants see them. Each figure exists as a 2× resolution PNG for desktop (1440×900) and phone (390×844):

```text
docs/irb/screenshots/after/desktop/<ID>.png
docs/irb/screenshots/after/phone/<ID>.png
```

Regenerate with `npm run irb:shots -- --label after` (the PNGs are not committed). Screens show the fixed test data used for the before/after report (3 rounds; drawn round 2). Payment wording reflects `utils/payment.js` at capture time — the participation fee and payment timing are still pending PI confirmation (requirements.md Open Questions #8, #9), so recapture after they are set.

| 圖 | ID | 畫面 | 圖說（可直接用於送審文件） |
|----|----|------|---------------------------|
| 1 | P01 | 歡迎頁 | 實驗首頁：說明實驗流程、所需時間（約 20 分鐘）與資料用途，參與者按「開始實驗」進入說明階段。 |
| 2 | S01 | 說明 1：參與者的背景與角色 | 四個頭像代表四位參與者；頭像顏色代表所屬團體（藍色為國民黨、綠色為民進黨）。橘色外框「您」為參與者本人，粉紅色外框「搭檔」為配對的參與者。圖下附圖說與圖例。 |
| 3 | P02 | 說明 2：遊戲點數 | 以文字說明每回合的給予規則及四種可能結果的點數。 |
| 4 | S02 | 說明 3：互動紀錄 | 以網絡圖呈現四位參與者之間過去的互動：箭頭由做決定的人指向接收的人，深色「給予」、淺色「不給予」；右側（手機版為下方）清單以文字列出相同內容。圖下附圖說與圖例。 |
| 5 | S03 | 說明 4：介面提示 1（點擊前） | 練習點擊：灰色虛線上的「?」代表尚未查看的互動紀錄。 |
| 6 | S04 | 說明 4：介面提示 1（點擊後） | 點擊「?」後，虛線變為實線並顯示該次決定。 |
| 7 | S05 | 說明 5：介面提示 2 | 練習在完整網絡圖中點開所有「?」；圖說提醒正式實驗每回合都須先看完所有互動紀錄才能做決定。 |
| 8 | S06 | 說明 6：介面提示 3 | 練習使用 0–100 滑桿表達給予點數的機率；從「您」指向「搭檔」的動態虛線隨滑桿改變。圖下附圖說與圖例。 |
| 9 | P03 | 說明 7：理解測試 | 四題點數計算題，全部答對才能繼續；答錯時顯示規則說明後重新作答。 |
| 10 | S07 | 說明 8：點數兌換報酬說明 | 說明隨機抽取一回合計酬、1 點 = 新台幣 100 元、四種結果對應的點數與金額、報酬範圍、計算範例，以及以電子禮券寄送至 Email 的方式與時程。 |
| 11 | P04 | 說明 9：準備開始 | 告知正式實驗的回合數。 |
| 12 | S08 | 正式回合（尚未查看紀錄） | 每回合先點開所有「?」查看互動紀錄；網絡圖下方固定顯示完整圖例。 |
| 13 | S09 | 正式回合（紀錄已全部顯示） | 所有互動紀錄已顯示，按「開始決策」進入作答。 |
| 14 | S10 | 正式回合（作答中） | 以滑桿輸入給予點數的機率（0–100），並可展開點數計算方法。 |
| 15 | P05 | 結束 1：報名代碼確認 | 參與者輸入報名代碼。 |
| 16 | S11 | 結束 2：結果回顧 | 顯示每回合雙方的決定與點數，標示抽中的回合，並列出點數報酬算式與合計金額（新台幣）。 |
| 17 | S13 | 結束 3：Email | 參與者填寫 Email；頁面再次說明報酬金額、電子禮券與寄送時程。 |
| 18 | P06 | 結束 4：完成 | 感謝頁。 |
| 附 | S12 | 結果回顧讀取失敗時 | 若暫時無法取得結果，頁面顯示錯誤訊息與「重試」按鈕，不會顯示任何金額。 |
