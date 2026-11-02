# Deploy guide: PrelaunchUAE (plain English)

Same route as Net Capital: GitHub, then Vercel, then the domain. Nothing here has been done yet.

1. **GitHub.** Create an empty private repository (suggested name `prelaunchuae`) and push this folder to it. Pictures in `public/media` are not uploaded; the build downloads them (about 680 files, under a minute).
2. **Vercel.** Add New, Project, import the repository. Framework Next.js, default build command, Node 24.
   | Name | Production | Preview |
   |---|---|---|
   | `NEXT_PUBLIC_SITE` | `prelaunchuae` | `prelaunchuae` |
   | `SITE_ENV` | `production` | `preview` |
   | `LEAD_SITE_KEY` / `CONTENT_SITE_KEY` | the new `prelaunchuae` key from the desk (NEEDS-FROM-MBR #1) | same |
   | `REVALIDATE_SECRET` | a long random text | same |
3. **Domain.** Add `prelaunchuae.com` (main) and `www.prelaunchuae.com` (redirects to it). Copy the DNS records Vercel shows; in Cloudflare use DNS only (grey cloud).
4. **Check the forms.** Send one enquiry from the live contact page. It must appear in the CRM under PrelaunchUAE.
5. **Search engines.** Search Console, add the property, submit `/sitemap.xml`. See NEEDS-FROM-MBR #10 before asking Google to index.
6. **Updating projects.** Run Update properties in the desk, then redeploy. Each build pulls the list again and keeps only New launch and Coming soon.
