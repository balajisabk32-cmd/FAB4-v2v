import os
import zipfile

def zip_project(source_dir, output_filename):
    # Folders to exclude to keep the zip size small
    exclude_dirs = {
        'node_modules', 
        '.next', 
        '.git', 
        'venv', 
        '.venv',
        '__pycache__',
        '.vscode'
    }

    print(f"Creating zip file: {output_filename}")
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                # Exclude hidden files that aren't necessary (optional, but let's keep env files since they have the API key they need)
                file_path = os.path.join(root, file)
                # Calculate path relative to the source directory
                arcname = os.path.relpath(file_path, start=source_dir)
                try:
                    zipf.write(file_path, arcname)
                except Exception as e:
                    print(f"Failed to add {file_path}: {e}")
                    
    print("Zip complete!")

if __name__ == "__main__":
    source_directory = r"c:\Downloads\FAB4-v2v-main\FAB4-v2v-main"
    output_zip = r"c:\Downloads\Sakhi-HerMode-Project.zip"
    zip_project(source_directory, output_zip)
