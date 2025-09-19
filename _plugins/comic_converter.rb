require 'digest'
require 'fileutils'
require 'tempfile'

module Jekyll
  # Hook to process Comic code blocks in markdown files before rendering
  Jekyll::Hooks.register [:pages, :posts, :documents], :pre_render do |page|
    if page.content && (page.extname == '.markdown' || page.extname == '.md')
      Jekyll::ComicProcessor.process_comic_blocks(page)
    end
  end

  class ComicProcessor
    def self.process_comic_blocks(page)
      return unless page.content

      # Create assets directory for generated comic images
      assets_dir = File.join(page.site.source, 'assets', 'generated', 'comic')
      FileUtils.mkdir_p(assets_dir)

      # Pattern to match Comic code blocks
      comic_pattern = /```comic\s*\n(.*?)\n```/m

      page.content = page.content.gsub(comic_pattern) do |match|
        comic_content = $1.strip
        
        # Generate a unique filename based on content hash
        content_hash = Digest::MD5.hexdigest(comic_content)
        image_filename = "comic_#{content_hash}.svg"
        image_path = File.join(assets_dir, image_filename)
        
        # Generate image if it doesn't exist or content has changed
        unless File.exist?(image_path)
          generate_comic_image(comic_content, image_path, page.site.source)
        end
        
        # Return HTML img tag with relative path
        relative_image_path = "/assets/generated/comic/#{image_filename}"
        
        <<~HTML
          <div class="comic-panel">
            <img src="#{relative_image_path}" alt="Comic Panel" class="comic-image" />
          </div>
        HTML
      end
    end

    def self.generate_comic_image(comic_content, output_path, site_source)
      # Create a temporary markdown file with the comic content
      temp_file = Tempfile.new(['comic_storyboard', '.md'])
      
      begin
        # Write comic content with global defaults to temporary file
        comic_markdown = build_comic_markdown(comic_content, site_source)
        temp_file.write(comic_markdown)
        temp_file.close
        
        # Path to the comic CLI
        comic_cli_path = File.join(site_source, 'custom', 'comic', 'comic-panel-cli.js')
        
        # Create temporary output directory
        temp_output_dir = Dir.mktmpdir
        
        # Run comic CLI to generate SVG
        command = ["node", comic_cli_path, temp_file.path, temp_output_dir]
        success = system(*command)
        
        if success
          # Find the generated SVG file and copy it to the output path
          generated_files = Dir.glob(File.join(temp_output_dir, "panel-*.svg"))
          if generated_files.any?
            # For single panels, use the first generated file
            FileUtils.cp(generated_files.first, output_path)
            puts "Generated comic panel: #{File.basename(output_path)}"
          else
            create_error_svg(output_path, "No comic panel generated")
          end
        else
          create_error_svg(output_path, "Comic generation failed")
        end
        
      rescue => e
        create_error_svg(output_path, "Comic generation error: #{e.message}")
      ensure
        # Clean up temporary files
        temp_file.unlink if temp_file
        FileUtils.rm_rf(temp_output_dir) if temp_output_dir
      end
    end

    def self.build_comic_markdown(comic_content, site_source)
      # Global defaults for comic generation
      font_path = File.join(site_source, 'assets', 'fonts', 'SpaceMono-Regular.ttf')
      sprite_root = File.join(site_source, 'custom', 'comic', 'output')
      
      defaults = [
        "panelWidth: 1024",
        "panelHeight: 768", 
        "spriteScale: 0.92",
        "fontSize: 36",
        "background: #ffffff",
        "margin: 48",
        "dialogueAreaHeight: 240"
      ]
      
      # Add font path if it exists
      if File.exist?(font_path)
        defaults << "fontPath: #{font_path}"
      end
      
      # Add sprite root
      defaults << "spriteRoot: #{sprite_root}"
      
      # Build the complete markdown
      markdown_content = defaults.join("\n") + "\n\n"
      markdown_content += "```comic Panel\n"
      markdown_content += comic_content + "\n```"
      
      markdown_content
    end

    def self.create_error_svg(output_path, error_message)
      error_svg = <<~SVG
        <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="200" fill="#ffebee" stroke="#f44336" stroke-width="2"/>
          <text x="200" y="100" text-anchor="middle" dominant-baseline="middle" 
                font-family="Arial, sans-serif" font-size="14" fill="#d32f2f">
            #{error_message}
          </text>
        </svg>
      SVG
      
      File.write(output_path, error_svg)
    end
  end
end
