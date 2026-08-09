-- Optional: one sample article in all 4 locales, to sanity-check your
-- connection once the site is wired to Supabase. Safe to delete afterward
-- from the Table Editor.

with new_article as (
  insert into public.articles (category, featured, status, published_at)
  values ('phones', true, 'published', now())
  returning id
)
insert into public.article_translations
  (article_id, locale, slug, title, excerpt, content, read_time)
select id, locale, slug, title, excerpt, content, read_time
from new_article
cross join (
  values
    (
      'ar', 'sample-article',
      'مقال تجريبي — يمكن حذفه',
      'هذا مقال تجريبي للتأكد من اتصال الموقع بقاعدة البيانات بنجاح.',
      'هذا محتوى تجريبي. إذا كنت تراه على الموقع فهذا يعني أن الاتصال بـ Supabase يعمل بشكل صحيح. يمكنك حذف هذا المقال من الجدول articles في Table Editor.',
      '2 دقيقة'
    ),
    (
      'en', 'sample-article',
      'Sample article — safe to delete',
      'A test article to confirm the site is reading from Supabase correctly.',
      'This is placeholder content. If you can see this on the site, the Supabase connection is working. You can delete this article from the articles table in the Table Editor.',
      '2 min read'
    ),
    (
      'fr', 'article-exemple',
      'Article d''exemple — peut être supprimé',
      'Un article de test pour vérifier que le site lit bien les données depuis Supabase.',
      'Ceci est un contenu provisoire. Si vous le voyez sur le site, la connexion à Supabase fonctionne. Vous pouvez supprimer cet article depuis la table articles dans le Table Editor.',
      '2 min de lecture'
    ),
    (
      'es', 'articulo-de-ejemplo',
      'Artículo de ejemplo — se puede eliminar',
      'Un artículo de prueba para confirmar que el sitio lee correctamente desde Supabase.',
      'Este es contenido provisional. Si lo ves en el sitio, la conexión con Supabase funciona. Puedes eliminar este artículo desde la tabla articles en el Table Editor.',
      '2 min de lectura'
    )
) as t(locale, slug, title, excerpt, content, read_time);
