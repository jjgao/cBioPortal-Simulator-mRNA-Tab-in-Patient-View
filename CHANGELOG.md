# Changelog

All notable changes to this project will be documented in this file.

## [0.02] - GTEx & Visualization Update

### Added
- **GTEx Integration**:
  - New "Normal Tissues" view in the Expression tab showing median gene expression across healthy tissues (GTEx V8).
  - Automatic highlighting of the normal tissue corresponding to the patient's cancer type (e.g., Brain for Glioblastoma).
- **Chart Improvements**:
  - **Expression Scatter Plot**: Implemented layered rendering to ensure patient samples are always visible on top of the reference cohort.
  - **UI/UX**: Moved the "Pancancer vs. Cancer Type" toggle directly into the chart panel for better usability.
  - Increased chart height for better readability of tissue labels.
- **AI Enhancements**:
  - Updated Gemini prompt to include normal tissue expression context, allowing for "Tumor vs. Normal" analysis in the Gene Insight Card.

## [0.01] - Initial Release

### Added
- **Expression Tab**:
  - Multi-sample gene expression table with Z-score heatmaps.
  - Support for displaying Mutation, CNA, and Fusion badges per sample.
  - Interactive Scatter/Strip plot for cohort comparison.
  - Toggle between **Pancancer** and **Same Cancer Type** cohort backgrounds.
  - Detail view showing expression values across all patient samples side-by-side.
- **AI Integration**:
  - "Gene Insight Card" powered by Google Gemini.
  - Context-aware analysis comparing tumor evolution (e.g., Primary vs. Metastasis).
- **Patient View Layout**:
  - Patient clinical banner (Age, Sex, Mutation Count).
  - Navigation tabs (Summary, Clinical, Mutations, Expression, etc.).