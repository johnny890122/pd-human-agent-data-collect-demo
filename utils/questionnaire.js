// Post-survey questionnaire (REQ-416). The only place the wording lives: imported by the outro
// page, the server (validation) and the submissions CSV export. Text as supplied, with 曆→歷 in Q2
// and full-width ？ throughout (2026-11-17).

export const QUESTIONNAIRE = [
  { id: 'Q1', text: '有人說金馬獎是「兩岸電影人開展交流的平台，應該開放中國電影人及電影報名參賽。」請問您同意不同意這樣的說法？', options: ['同意', '不同意'] },
  { id: 'Q2', text: '有人說我們應該在中小學課程中增加中國大陸歷史文化的教材，請問您同不同意這樣的說法？', options: ['同意', '不同意'] },
  { id: 'Q3', text: '整體來說，過去台灣政府處理新冠肺炎疫情表現好不好？', options: ['好', '不好'] },
  { id: 'Q4', text: '有人說高中的國文學科降低文言文比例，才有更多空間加入有台灣特色的文學作品。請問您同意不同意這樣的說法？', options: ['同意', '不同意'] },
  { id: 'Q5', text: '有人說開放中國人民來台觀光，帶動臺灣旅遊業的發展，有效促進臺灣經濟。請問您同意不同意這樣的說法？', options: ['同意', '不同意'] },
  { id: 'Q6', text: '中國歌唱綜藝節目讓台灣觀眾有全新的視覺體驗，應該多多引進播放。請問您同意不同意這樣的說法？', options: ['同意', '不同意'] },
  { id: 'Q7', text: '中國的電影、音樂、和書籍對我們的本土文化會有一定程度的傷害。請問您同意不同意這樣的說法？', options: ['同意', '不同意'] },
  { id: 'Q8', text: '台灣目前大約有超過59萬人的中國大陸及東南亞籍外籍配偶，其中大陸、港澳配偶占64.67%。請問您認為政府未來應該管制，還是開放大陸、港澳配偶移民來台灣？', options: ['管制', '開放'] },
];

/**
 * REQ-416: an answer is stored as the option text the participant chose (同意 / 不同意 / 好 / …).
 * null when `answers` ([{ questionId, answer }]) has exactly one valid answer per question,
 * otherwise a message saying what is wrong.
 */
export function questionnaireError(answers) {
  if (!Array.isArray(answers)) return 'answers must be a list';
  const seen = new Set();
  for (const { questionId, answer } of answers) {
    const question = QUESTIONNAIRE.find((q) => q.id === questionId);
    if (!question) return `unknown question ${questionId}`;
    if (seen.has(questionId)) return `duplicate answer for ${questionId}`;
    if (!question.options.includes(answer)) return `${questionId}: "${answer}" is not one of ${question.options.join(' / ')}`;
    seen.add(questionId);
  }
  const missing = QUESTIONNAIRE.filter((q) => !seen.has(q.id)).map((q) => q.id);
  return missing.length ? `missing ${missing.join(', ')}` : null;
}
