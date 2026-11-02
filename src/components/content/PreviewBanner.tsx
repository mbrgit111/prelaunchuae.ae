/** Shown only to a person who opened a preview link from the desk. Visitors never see it. */
export function PreviewBanner({ status }: { status?: string }) {
  return (
    <div role="status" className="fixed inset-x-0 top-[72px] z-40 border-b border-ink bg-plot text-ink">
      <form action="/api/preview/exit" method="post" className="container-site flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
        <p>
          <strong>Preview.</strong> {status ? `Status: ${status}. ` : ''}This is not published, search engines cannot see it, and only you can open it.
        </p>
        <button type="submit" className="btn btn-dark btn-sm">
          Exit preview
        </button>
      </form>
    </div>
  );
}
