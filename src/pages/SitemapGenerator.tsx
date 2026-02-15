import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { propertyService } from '../services/propertyService';
import { downloadSitemap } from '../utils/sitemap';

const SitemapGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerateSitemap = async () => {
    try {
      setIsGenerating(true);
      setMessage(null);

      // Fetch all available properties
      const result = await propertyService.searchProperties({ sortBy: 'date' });

      // Generate and download sitemap
      downloadSitemap(result.properties);

      setMessage(`Sitemap generated successfully with ${result.properties.length} properties!`);
    } catch (error: any) {
      setMessage(`Error generating sitemap: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sitemap Generator</h1>

          <p className="text-gray-600 mb-6">
            Generate an XML sitemap for all active property listings. This sitemap can be submitted
            to search engines to improve SEO and help search engines discover your property
            listings.
          </p>

          <button
            onClick={handleGenerateSitemap}
            disabled={isGenerating}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Sitemap'}
          </button>

          {message && (
            <div
              className={`mt-4 p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
            >
              {message}
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Click "Generate Sitemap" to download the sitemap.xml file</li>
              <li>Upload the sitemap.xml file to your website's public folder</li>
              <li>Submit the sitemap URL to Google Search Console and Bing Webmaster Tools</li>
              <li>Regenerate the sitemap periodically as new properties are added</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SitemapGenerator;
