# Blog and news: the plain-English guide

For the founder. No coding needed. Three places are involved:

| Place | What it is | Who uses it |
|---|---|---|
| **The desk** (`MBR Desk`) | Where articles and pictures are written, checked and published | Writers, editors, approvers, admin |
| **The API** | The back office that stores everything and tells the website what is live | Nobody directly |
| **The website** (netcapital.ae) | Shows the articles to visitors | Everyone |

Only a **person** can publish. A robot or an automated writer can save drafts but can never publish, even with admin rights.

---

## 1. One-time setup (about 20 minutes)

### A. The picture storage (already done on your laptop)
Pictures uploaded in the desk are resized and saved in the Amazon bucket you added to the API's `.env`.

- They are saved only inside the folder `mbr-properties/`. Nothing else in the bucket is touched.
- The bucket is also used by another product (WellnessZ). That is fine, because of the folder, but do not delete the `mbr-properties` folder.
- **Visitors load the pictures straight from the bucket, so the `mbr-properties/` folder must be readable by the public.** This is already true today (tested). If pictures ever stop showing on the website, this is the first thing to check in the AWS console.
- On the live API server, set the same four values: `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (the names are in `.env.example`). Never paste them into chat or commit them.
- Tip: ask your cloud person for a key that can only write to that bucket.

### B. Three values on the website (Vercel)
Vercel → your project → Settings → Environment Variables → add for **Production** (and Preview if you use it):

| Name | What to put | Where it comes from |
|---|---|---|
| `CONTENT_API_URL` | The live address of your API, for example `https://api.yourdomain.com` | Wherever the API is hosted |
| `CONTENT_SITE_KEY` | The public key of the site, starts with `pk_` | The API's sites list (the seed shows it) |
| `REVALIDATE_SECRET` | A long secret. **Make it in the desk** (step C), then paste it here | Desk → Setup → Website connection |

Optional: `CONTENT_STATUS_TOKEN`. If you set it, you can open `https://www.netcapital.ae/api/content-status` (send it as a "Bearer" token) to see whether the website is reading the API, the saved copy, or the older files.

After changing variables, press **Redeploy** in Vercel.

### C. Connect the desk to the website
1. Sign in to the desk as **admin**.
2. **Setup → Website connection**.
3. **Refresh address**: `https://www.netcapital.ae/api/revalidate`
4. **Preview address**: `https://www.netcapital.ae/api/preview`
5. Press **Make a secret**. It is shown **once**. Copy it into Vercel as `REVALIDATE_SECRET` (step B) and redeploy.
6. Press **Save connection**, then **Test the connection**.
   - Green message "Connected": done.
   - "The secret does not match": the value in Vercel is different. Paste again.
   - "Could not reach the website": the address is wrong or the site is not deployed yet.
   - "The website has no REVALIDATE_SECRET": add it in Vercel and redeploy.

### D. Add the people and topics
Desk → **Setup**:
- **Authors**: real people or your team name. The demo author says "(placeholder)": replace it before real publishing.
- **Categories**: the topics readers see as filter buttons.
- **Rules** (admin only): the list of risky phrases (for example "guaranteed returns") that an approver must explain in writing before publishing, and the minimum word counts.

---

## 2. Publish a test post (5 minutes)

1. Desk → **Blog** → **New blog post**. Pick the site, type a title.
2. Write in the editor. Use **H2** for section headings (three or more headings give the reader a contents list).
3. **Cover picture**: press **Choose a cover**, upload a JPG or PNG (up to 10 MB), and describe it in a few words.
4. Fill the summary and the **SEO check** panel, and press **Run the SEO check**. Orange items are advice. Red "copied text" blocks you from sending it for review.
5. Press **Preview on website** to see exactly how it will look. A black bar says "Preview" and Google cannot see it.
6. **Send for review**. An approver signs in, reads it and presses **Approve**.
7. An editor presses **Publish**. In a few seconds the website shows it. The panel says "Website updated".

News items are the same but need at least one **source** (a web address) and are shown at `/news/...`.

**Take down** removes it from the website at once. **Schedule** publishes at a time you pick.

---

## 3. Pictures
- **Pictures** in the top menu is the library. Upload many at once, add a description (alt text), a caption and a credit.
- Every upload is turned into small, light versions (AVIF and WebP) so the page is fast on a cheap phone on 4G. You do not need to shrink pictures yourself.
- A picture used by an article cannot be deleted until it is removed from the article.
- Anyone who writes can upload. Only editors and admins can delete.

## 4. Redirects
- If you change the **web address (slug)** of a live article, the desk keeps a redirect from the old address automatically.
- **Setup → Redirects** is for anything else (old pages, typos). Redirects use a real "moved permanently" (301) answer, so Google follows them. The website remembers the list for up to one minute.

## 5. Older articles
Net Capital has no older article files (`data/posts.json` is empty), so everything comes from the desk.

## 6. If something looks wrong

| What you see | Most likely reason | What to do |
|---|---|---|
| Published, but the website still shows the old version | The refresh did not arrive | Desk → Setup → Website connection → **Test the connection**. The site also refreshes itself within 10 minutes. |
| Pictures missing on the website | The bucket folder is not public, or the picture was deleted in AWS | Check the bucket's public-read rule for `mbr-properties/` |
| "Image storage is not set up yet" in the desk | The four AWS values are missing on the API server | Add them and restart the API |
| The site shows the older articles, not desk ones | The website cannot reach the API | Check `CONTENT_API_URL` and `CONTENT_SITE_KEY` in Vercel. `/api/content-status` tells you. |
| Cannot publish: "copied text" | More than 60% matches another article (on any of your sites) | Rewrite it in your own words, or ask the admin to change the limit in Rules |
| Cannot publish: "flagged wording" | A risky phrase is in the text | Remove it, or an approver can approve it with a written reason (recorded) |
| A preview link says expired | Links last 30 minutes | Press **Preview on website** again |

When the API is down, the website keeps showing the last good pages. Visitors are not affected; only the desk stops working.

## 7. Which site
In the desk, choose the site **Net Capital** before writing. Articles for Dubai South Capital never appear here, and
the reverse: each site reads only its own articles with its own key.

## 8. What stays in your hands
- Compliance phrase list, approver emails, and the live refresh and preview addresses for Net Capital (`https://www.netcapital.ae/api/revalidate` and `https://www.netcapital.ae/api/preview`).
