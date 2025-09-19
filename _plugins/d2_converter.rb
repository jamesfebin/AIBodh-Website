require 'digest'
require 'fileutils'
require 'tempfile'

module Jekyll
  # Hook to process D2 code blocks in markdown files before rendering
  Jekyll::Hooks.register [:pages, :posts, :documents], :pre_render do |page|
    if page.content && (page.extname == '.markdown' || page.extname == '.md')
      Jekyll::D2Processor.process_d2_blocks(page)
    end
  end

  class D2Processor
    def self.process_d2_blocks(page)
      return unless page.content

      # Create assets directory for generated SVGs
      assets_dir = File.join(page.site.source, 'assets', 'generated', 'd2')
      FileUtils.mkdir_p(assets_dir)

      # Pattern to match D2 code blocks
      d2_pattern = /```d2\s*\n(.*?)\n```/m

      page.content = page.content.gsub(d2_pattern) do |match|
        d2_content = $1.strip
        
        # Generate a unique filename based on content hash
        content_hash = Digest::MD5.hexdigest(d2_content)
        svg_filename = "d2_#{content_hash}.svg"
        svg_path = File.join(assets_dir, svg_filename)
        
        # Generate SVG if it doesn't exist or content has changed
        unless File.exist?(svg_path)
          generate_d2_svg(d2_content, svg_path)
        end
        
        # Return HTML img tag with relative path
        relative_svg_path = "/assets/generated/d2/#{svg_filename}"
        
        <<~HTML
          <div class="d2-diagram">
            <img src="#{relative_svg_path}" alt="D2 Diagram" class="d2-svg" />
          </div>
        HTML
      end
    end

    def self.generate_d2_svg(d2_content, output_path)
      # Create a temporary D2 file
      temp_file = Tempfile.new(['diagram', '.d2'])
      
      begin
        # Write D2 content to temporary file
        temp_file.write(d2_content)
        temp_file.close
        
        # Run D2 CLI to generate SVG
        command = ["d2", "--theme=3", temp_file.path, output_path]
        success = system(*command)
        
        unless success
          # Create a fallback error SVG
          create_error_svg(output_path, "D2 conversion failed")
        end
        
      rescue => e
        create_error_svg(output_path, "D2 conversion error: #{e.message}")
      ensure
        # Clean up temporary files
        temp_file.unlink if temp_file
      end
    end

    def self.create_error_svg(output_path, error_message)
      error_svg = <<~SVG
        <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="100" fill="#ffebee" stroke="#f44336" stroke-width="2"/>
          <text x="200" y="50" text-anchor="middle" dominant-baseline="middle" 
                font-family="Arial, sans-serif" font-size="12" fill="#d32f2f">
            #{error_message}
          </text>
        </svg>
      SVG
      
      File.write(output_path, error_svg)
    end
  end
end
