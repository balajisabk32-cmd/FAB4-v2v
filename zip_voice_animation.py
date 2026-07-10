import os
import zipfile

def zip_files(files_to_zip, output_filename, base_dir):
    print(f"Creating zip file: {output_filename}")
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_rel_path in files_to_zip:
            file_abs_path = os.path.join(base_dir, file_rel_path)
            if os.path.exists(file_abs_path):
                try:
                    zipf.write(file_abs_path, file_rel_path)
                    print(f"Added: {file_rel_path}")
                except Exception as e:
                    print(f"Failed to add {file_abs_path}: {e}")
            else:
                print(f"File not found, skipping: {file_rel_path}")
                    
    print("Zip complete!")

if __name__ == "__main__":
    base_directory = r"c:\Downloads\FAB4-v2v-main\FAB4-v2v-main"
    output_zip = r"c:\Downloads\Sakhi-Voice-Animation-Files.zip"
    
    # Specific files related to voice and animation
    files_to_include = [
        r"frontend\components\SakhiAvatar.tsx",
        r"frontend\hooks\useSakhiChat.ts",
        r"frontend\app\api\ask-sakhi\route.ts",
        r"frontend\public\sakhi-doll.png",
        r"frontend\public\sakhi-doll-open.png",
        r"frontend\app\her-mode\page.tsx" # Include this so they see how it's imported
    ]
    
    zip_files(files_to_include, output_zip, base_directory)
