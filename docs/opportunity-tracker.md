---
sidebar_position: 2
---

# Opportunity Tracker

The Opportunity Tracker consolidates all opportunities available to your business in a single, consistent view.

## Features

- **Opportunities in one table**: Opportunity and project dates, location, security clearance requirements, role requirements, extraction of required forms and documents
- **Manage opportunities**: Mark opportunities to bid or not bid, add notes, manage submitted opportunities, receive notifications
- **Further insight**: AI summaries on opportunities, discover talent-opportunity alignment

## How Tos

### How to address changes to opportunity sources

Contact the FiOS team to support any changes with the opportunity sources, whether it is to add, remove or update access credentials.

:::note
If passwords have changed, this will impact the ability for the platform to pull opportunities from the source.
:::

### How to modify information on an opportunity

1. Click onto the opportunity to bring out the Opportunity details panel
2. Review and update the opportunity details as required
3. Select **Save** at the bottom right of the panel to save changes
4. Use the Comments field to add additional notes

### How to customise my view {#customise-view}

Columns can be repositioned to suit your needs:

- **Columns > Customise Columns** - Select which columns to display
- **Columns > Save as new** - Create a new column ordering view
- **Columns > Save** - Override current view
- **Columns > Rename** - Rename a view
- **Columns > Delete** - Delete a view

### How to find opportunities

**Manual scrolling**: Scroll through the table

**Sorting**: Click column headers with the ⇅ symbol to sort ascending/descending

**Filtering via tiles**: Click the tiles at the top to filter by status

**Filtering via values**: Click the filter funnel icon for advanced filtering

**Searching**: Use the search box at the top left for free text search

:::tip
The Opportunity tracker by default only displays open opportunities. Uncheck *Hide expired* to view past opportunities.
:::

### Can I manually add opportunities?

Yes! Use the **Add** button on the top right of the table to manually add opportunities from undefined sources.

### How to bulk import opportunities via CSV {#bulk-import}

If you have a list of opportunities in a spreadsheet, you can import them all at once rather than adding them one by one.

1. Select **Bulk import** at the top right of the table (next to the **Add** button).
2. In the modal that appears, drag and drop your `.csv` file onto the upload area, or select **Browse** to locate the file on your device.
3. FiOS will display a preview table and attempt to auto-match your file's column headers to the expected fields. Review the column mappings and adjust any that weren't matched correctly.
4. Select **Confirm import** to proceed.

Once the import completes, a summary notification will confirm how many opportunities were imported and how many rows were skipped.

:::note
Imported opportunities are assigned the status **Pending Review** and follow the normal triage flow from there.
:::

#### Required and optional columns

| Column | Required? |
|---|---|
| Title | Required |
| Source | Required |
| Closing Date | Required |
| Location | Optional |
| Clearance | Optional |
| Notes | Optional |

#### Handling rows with missing required fields

Any row that is missing a required field is flagged in red in the preview table and will be skipped during import. The summary notification at the end of the import will tell you how many rows were skipped so you can correct and re-import them.

## Opportunity Status

### Pre-submission status

- **Pending Review**: Opportunity has yet to be triaged (default status)
- **Confirm Candidates**: Opportunity is being triaged for suitable candidates
- **Bid Development**: Candidates confirmed, proceeding to bid development
- **Submitted**: Bid has been submitted
- **No Bid**: Opportunity deemed not suitable

### Post-submission status

- **Submitted**: Bid submitted and awaiting response
- **Withdrawn**: Opportunity has been withdrawn
- **Shortlisted**: Application has been down-selected
- **Won**: Opportunity won
- **Lost**: Opportunity lost

## Specifications

### What opportunity sources are available?

Opportunities from websites or emails (including attachments) can be consolidated into the Opportunity Tracker. Contact the FiOS team to add more sources.

### How often are opportunities updated?

FiOS pulls opportunities from your sources every **two hours**.

### How accurate is the data?

FiOS uses AI to analyse information. The AI analysis provides a confidence score. While we continuously improve results, **human review is important**—AI cannot factor in external or soft environmental factors.
