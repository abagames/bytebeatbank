module.exports = function(grunt) {
  grunt.initConfig({
    typescript: {
      base: {
        src: ['./src/*.ts'],
        dest: './bytebeatbank.js',
        options: {
          target: 'es5'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-typescript');
  grunt.registerTask('default', ['typescript']);
};
