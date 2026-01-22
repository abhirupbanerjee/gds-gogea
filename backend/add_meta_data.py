import io
import json
import re
import pdfplumber
import pandas as pd
from docx import Document


def parse_text_metadata(text: str):
    """Extract metadata from plain text, ensuring no empty keys."""
    metadata = {}
    lines = text.split("\n")

    for line in lines:
        parts = line.split(":", 1)
        if len(parts) == 2:
            key, value = parts
            key, value = key.strip(), value.strip()
            if key:  # ✅ Ignore empty keys
                metadata[key] = value

    return metadata


def parse_excel_metadata(df):
    """Extract metadata from an Excel table, ensuring no empty keys."""
    metadata = {}

    for index, row in df.iterrows():
        if len(row) >= 2:
            key, value = str(row[0]).strip(), str(row[1]).strip()
            if key:  # ✅ Ignore empty keys
                metadata[key] = value

    return metadata


def extract_pdf_table_metadata(pdf):
    """Extract metadata from a structured table inside a PDF, ensuring correct key-value mapping."""
    table_metadata = {}

    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                # Ensure row has at least three columns (S. No., Data Elements, Values)
                if len(row) >= 3:
                    key = row[1].strip() if row[1] else None  # Extract 'Data Elements' column
                    value = row[2].strip() if row[2] else None  # Extract 'Values' column

                    if key and value:  # Ensure valid key-value pairs
                        key = re.sub(r'\s+', ' ', key)  # Normalize whitespace in keys
                        value = re.sub(r'\s+', ' ', value)  # Normalize whitespace in values
                        
                        if key == "Document Version, Month, Year of Release":
                            # Extract structured version information
                            match = re.match(r"Version (\S+), (\w+) (\d{4})", value)
                            if match:
                                table_metadata["Document Version"] = f"Version {match.group(1)}"
                                table_metadata["Month"] = match.group(2)
                                table_metadata["Year"] = match.group(3)
                            else:
                                table_metadata[key] = value  # Fallback if format doesn't match
                        else:
                            table_metadata[key] = value

    return table_metadata


def extract_metadata_from_file(file_data: bytes, filename: str):
    """Extract metadata from PDF, Excel (Metadata sheet), and DOCX files while converting all keys and values to lowercase."""
    metadata = {}

    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_data)) as pdf:
            # Extract text-based metadata
            text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
            metadata = parse_text_metadata(text)

            # Extract structured table metadata
            table_metadata = extract_pdf_table_metadata(pdf)

            # Merge extracted metadata
            metadata.update(table_metadata)

    elif filename.endswith(".xlsx"):
        # Load only the "Metadata" sheet
        df = pd.read_excel(io.BytesIO(file_data), sheet_name="Metadata")

        # Ensure it contains valid data
        if not df.empty and df.shape[1] >= 2:
            metadata = parse_excel_metadata(df)

    elif filename.endswith(".docx"):
        doc = Document(io.BytesIO(file_data))
        text = "\n".join([para.text for para in doc.paragraphs])
        metadata = parse_text_metadata(text)

    # ✅ Convert all keys and values to lowercase
    metadata = {k.lower(): v.lower() for k, v in metadata.items() if k.strip()}

    # ✅ Always keep filename, status, and language
    metadata["filename"] = filename.lower()
    metadata["status"] = metadata.get("present status", "unknown").lower()
    metadata["language"] = metadata.get("language", "unknown").lower()

    return metadata


def extract_excel_metadata(file_data: bytes):
    """Extracts metadata from an Excel sheet named 'Metadata' and returns it in the required format."""
    metadata = {}

    try:
        xls = pd.ExcelFile(io.BytesIO(file_data))
        print("Available sheets:", xls.sheet_names)  # Debug: Print available sheets

        if "Metadata" not in xls.sheet_names:
            print("❌ Sheet 'Metadata' not found! Check the sheet names in the Excel file.")
            return {}

        df = pd.read_excel(xls, sheet_name="Metadata", header=None)
        print("🔹 DataFrame read successfully:")
        print(df.head())  # Debug: Print first few rows

        if df.empty or df.shape[1] < 3:  # Ensure at least 3 columns exist
            print("❌ Sheet is empty or does not have enough columns.")
            return {}

        # Skip the first row if it contains headers (like "S. No." / "Data Elements / Values")
        if "S. No." in str(df.iloc[0, 0]) and "Data Elements" in str(df.iloc[0, 1]):
            df = df.iloc[1:]  # Skip first row
            print("🔹 Skipped first row (header detected)")

        # Extract key-value pairs from columns 1 and 2 (Data Elements and Values)
        for _, row in df.iterrows():
            key = str(row[1]).strip()  # Column 1: Data Elements
            value = str(row[2]).strip()  # Column 2: Values

            if key:  # Ensure the key is not empty
                metadata[key] = value

        print("✅ Extracted metadata:", metadata)
        return metadata

    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")
        return {}


# Test file paths
pdf_path = r"C:\Users\HJ161HA\Downloads\Repository\Repository\1 Digital Grenada.pdf"
excel_path = r"C:\Users\HJ161HA\Downloads\Repository\Repository\12  Roadmap tookit.xlsx"


def test_pdf_metadata():
    with open(pdf_path, "rb") as f:
        file_data = f.read()
    metadata = extract_metadata_from_file(file_data, "1 Digital Grenada.pdf")
    print(json.dumps(metadata, indent=4))


def test_excel_metadata(excel_path):
    with open(excel_path, "rb") as f:
        file_data = f.read()
    metadata = extract_excel_metadata(file_data)
    print(json.dumps(metadata, indent=4))


def test_docx_metadata():
    with open("sample.docx", "rb") as f:
        file_data = f.read()
    metadata = extract_metadata_from_file(file_data, "sample.docx")
    print(json.dumps(metadata, indent=4))


if __name__ == "__main__":
    test_pdf_metadata()
    test_excel_metadata(excel_path)
    #test_docx_metadata()
