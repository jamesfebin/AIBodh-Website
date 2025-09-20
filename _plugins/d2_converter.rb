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

      # Create directories inside both the built site (_site) and the source tree
      built_assets_dir  = File.join(page.site.dest,   'assets', 'generated', 'd2')
      source_assets_dir = File.join(page.site.source, 'assets', 'generated', 'd2')
      FileUtils.mkdir_p(built_assets_dir)
      FileUtils.mkdir_p(source_assets_dir)

      # Pattern to match D2 code blocks
      d2_pattern = /```d2\s*\n(.*?)\n```/m

      page.content = page.content.gsub(d2_pattern) do |match|
        d2_content = $1.strip
        
        # Generate a unique filename based on content hash
        content_hash = Digest::MD5.hexdigest(d2_content)
        svg_filename      = "d2_#{content_hash}.svg"
        built_svg_path    = File.join(built_assets_dir, svg_filename)
        source_svg_path   = File.join(source_assets_dir, svg_filename)

        unless File.exist?(built_svg_path)
          if File.exist?(source_svg_path)
            FileUtils.cp(source_svg_path, built_svg_path)
            Jekyll.logger.info("d2", "Copied cached #{svg_filename} for #{page.path}")
          else
            Jekyll.logger.info("d2", "Rendering #{svg_filename} for #{page.path}")
            generate_d2_svg(d2_content, built_svg_path, page.site.source, source_svg_path)
          end
        end

        register_static_file(page.site, 'assets/generated/d2', svg_filename)

        # Return HTML img tag with relative path
        baseurl = page.site.config["baseurl"].to_s
        baseurl = "" if baseurl == "/"
        relative_svg_path = "#{baseurl}/assets/generated/d2/#{svg_filename}"
        
        <<~HTML
          <div class="d2-diagram">
            <img src="#{relative_svg_path}" 
                 alt="D2 Diagram" 
                 class="d2-svg comic-image"
                 data-comic-hash="#{content_hash}"
                 data-comic-settings="d2-diagram" />
          </div>
        HTML
      end
    end

    def self.generate_d2_svg(d2_content, output_path, site_source, mirror_path = nil)
      FileUtils.mkdir_p(File.dirname(output_path))
      # Create a temporary D2 file
      temp_file = Tempfile.new(['diagram', '.d2'])
      
      begin
        # Write D2 content to temporary file
        temp_file.write(d2_content)
        temp_file.close
        
        # Run D2 CLI to generate SVG with default fonts
        # Font will be handled by CSS (JetBrains Mono)
        command = ["d2", "--theme=3"]
        puts "Using default D2 fonts (JetBrains Mono will be applied via CSS)"
        
        command += [temp_file.path, output_path]
        success = system(*command)

        unless success
          create_error_svg(output_path, "D2 conversion failed")
        else
          Jekyll.logger.info("d2", "Generated #{File.basename(output_path)}")
        end
      rescue => e
        create_error_svg(output_path, "D2 conversion error: #{e.message}")
      ensure
        # Clean up temporary files
        temp_file.unlink if temp_file
        mirror_file(output_path, mirror_path)
      end
    end

    def self.create_error_svg(output_path, error_message)
      FileUtils.mkdir_p(File.dirname(output_path))
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

    def self.mirror_file(source_path, mirror_path)
      return unless mirror_path
      return unless File.exist?(source_path)

      FileUtils.mkdir_p(File.dirname(mirror_path))
      FileUtils.cp(source_path, mirror_path)
    end

    def self.register_static_file(site, relative_dir, filename)
      existing = site.static_files.any? do |static_file|
        static_file.relative_path == File.join('/', relative_dir, filename)
      end
      return if existing

      site.static_files << Jekyll::StaticFile.new(site, site.source, relative_dir, filename)
    end
  end
end
