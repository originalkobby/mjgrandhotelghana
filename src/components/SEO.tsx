import { Helmet } from "react-helmet-async";

const SEO = ({ title, description, path }: { title: string; description: string; path: string }) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`https://mjgrandhotelghana.com${path}`} />
    </Helmet>
  );
};
export default SEO;
