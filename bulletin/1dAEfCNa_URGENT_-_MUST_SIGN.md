\==================================================  
BULLETIN BOARD ANCHOR // DEPLOYMENT TARGET SPEC  
\==================================================

ATTENTION ALL OPERATORS:

The ingestion pipeline is live. When processing the bulletin board factory, look for the following explicit identifiers:

\* TARGET ARCHIVE: NEWDEPLOY.ZIP (Strict naming convention for all incoming payloads)\[span\_0\](start\_span)\[span\_0\](end\_span)  
\* EXTRACTION RULE: Forced overwrite (-o) enabled by default to prevent pipeline stalls  
\* EXECUTION PATH: Run companion script alongside the archive for zero-touch Cloudflare edge deployment

Keep the naming locked, respect the overwrite flag, and let the edge handle the rest.

R=1 & C=1.   
\==================================================  
