require 'digest'
require 'fileutils'
require 'tempfile'
require 'json'

module Jekyll
  # Process only markdown-like files
  Jekyll::Hooks.register [:pages, :posts, :documents], :pre_render do |page|
    next unless page.respond_to?(:content) && page.content

    ext = File.extname(page.path).downcase
    next unless %w[.md .markdown].include?(ext)

    Jekyll::ComicProcessor.process_comic_blocks(page)
  end

  class ComicProcessor
    # ONE source of truth. You can override these in _config.yml under 'comic:'.
    DEFAULTS = {
      "panelWidth"         => 1600,
      "panelHeight"        => 1400,
      "spriteScale"        => 1.0,
      "fontSize"           => 48,
      "background"         => "#ffffff",
      "margin"             => 260,
      "dialogueAreaHeight" => 520
    }.freeze

    def self.process_comic_blocks(page)
      return unless page.content

      settings = effective_settings(page.site)
      settings_fingerprint = fingerprint(settings)
      generator_fingerprint = generator_version(page.site.source)

      # Generate into the built site, not the source tree
      assets_dir = File.join(page.site.dest, 'assets', 'generated', 'comic')
      FileUtils.mkdir_p(assets_dir)

      comic_pattern = /```comic\s*\n(.*?)\n```/m

      page.content = page.content.gsub(comic_pattern) do
        comic_content = Regexp.last_match(1).strip

        # Hash includes content + *actual* settings in use
        content_hash   = Digest::MD5.hexdigest("#{comic_content}||#{settings_fingerprint}||#{generator_fingerprint}")
        image_filename = "comic_#{content_hash}.svg"
        image_path     = File.join(assets_dir, image_filename)

        generate_comic_image(comic_content, image_path, page.site.source, settings) unless File.exist?(image_path)

        baseurl = page.site.config["baseurl"].to_s
        baseurl = "" if baseurl == "/"
        relative_image_path = "#{baseurl}/assets/generated/comic/#{image_filename}"

        <<~HTML
          <div class="comic-panel">
            <img src="#{relative_image_path}"
                 alt="Comic Panel"
                 class="comic-image"
                 data-comic-hash="#{content_hash}"
                 data-comic-settings="#{settings_fingerprint}" />
          </div>
        HTML
      end
    end

    def self.generate_comic_image(comic_content, output_path, site_source, settings)
      temp_file = Tempfile.new(['comic_storyboard', '.md'])

      begin
        temp_file.write(build_comic_markdown(comic_content, site_source, settings))
        temp_file.close

        comic_cli_path = File.join(site_source, 'custom', 'comic', 'comic-panel-cli.js')
        temp_output_dir  = Dir.mktmpdir
        temp_output_path = File.join(temp_output_dir, "comic_output")

        success = system("node", comic_cli_path, temp_file.path, temp_output_path)

        if success
          generated_files = Dir.glob(File.join(temp_output_path, "panel-*.svg")).sort
          if generated_files.any?
            FileUtils.mkdir_p(File.dirname(output_path))
            source_panel = generated_files.first
            Jekyll.logger.debug("comic", "Copying #{source_panel} -> #{output_path}")
            FileUtils.cp(source_panel, output_path)

            # Mirror into source tree so the static asset pipeline doesn't overwrite the fresh build
            source_assets_dir = File.join(site_source, 'assets', 'generated', 'comic')
            FileUtils.mkdir_p(source_assets_dir)
            source_target = File.join(source_assets_dir, File.basename(output_path))
            Jekyll.logger.debug("comic", "Copying #{source_panel} -> #{source_target}")
            FileUtils.cp(source_panel, source_target)

            # Optional: stamp settings into the SVG as a comment for sanity checks
            stamp = "<!-- comic-settings: #{fingerprint(settings)} -->\n"
            svg = File.read(output_path)
            svg.sub!("<svg", "#{stamp}<svg")
            File.write(output_path, svg)
            File.write(source_target, svg)
          else
            create_error_svg(output_path, "No comic panel generated")
          end
        else
          create_error_svg(output_path, "Comic generation failed")
        end
      rescue => e
        create_error_svg(output_path, "Comic generation error: #{e.message}")
      ensure
        temp_file.unlink if temp_file
        FileUtils.rm_rf(temp_output_dir) if defined?(temp_output_dir) && temp_output_dir
      end
    end

    def self.build_comic_markdown(comic_content, site_source, settings)
      font_path   = File.join(site_source, 'assets', 'fonts', 'SpaceMono-Regular.ttf')
      sprite_root = File.join(site_source, 'custom', 'comic', 'output')

      lines = settings.map { |k, v| "#{k}: #{v}" }
      lines << "fontPath: #{font_path}" if File.exist?(font_path)
      lines << "spriteRoot: #{sprite_root}"

      <<~MD
        #{lines.join("\n")}

        ```comic Panel
        #{comic_content}
        ```
      MD
    end

    def self.create_error_svg(output_path, error_message)
      FileUtils.mkdir_p(File.dirname(output_path))
      svg = <<~SVG
        <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="200" fill="#ffebee" stroke="#f44336" stroke-width="2"/>
          <text x="200" y="100" text-anchor="middle" dominant-baseline="middle"
                font-family="Arial, sans-serif" font-size="14" fill="#d32f2f">#{error_message}</text>
        </svg>
      SVG
      File.write(output_path, svg)
    end

    # ----- helpers -----
    def self.effective_settings(site)
      # Allow overrides from _config.yml under 'comic:' (snake_case or camelCase)
      cfg = site.config["comic"] || {}
      normalized = cfg.each_with_object({}) do |(k, v), h|
        camel = k.to_s.gsub(/_(.)/) { $1.upcase }
        h[camel] = v
      end
      DEFAULTS.merge(normalized)
    end

    def self.fingerprint(settings)
      # stable, order-independent
      Digest::MD5.hexdigest(JSON.dump(settings.sort.to_h))
    end

    def self.generator_version(site_source)
      cli_path = File.join(site_source, 'custom', 'comic', 'comic-panel-cli.js')
      return 'missing-cli' unless File.exist?(cli_path)

      Digest::MD5.file(cli_path).hexdigest
    rescue StandardError => e
      "cli-error-#{Digest::MD5.hexdigest(e.message)}"
    end
  end
end
