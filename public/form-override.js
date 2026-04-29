// Contact form override — replaces mailto action with Resend API fetch
document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('form[action^="mailto"]');
    if (!form) return;

      // Remove the mailto behaviour
        form.removeAttribute('action');
          form.removeAttribute('method');
            form.removeAttribute('enctype');

              form.addEventListener('submit', async function (e) {
                  e.preventDefault();
                      var btn = form.querySelector('button[type="submit"]');
                          var name = (form.querySelector('#name') || form.querySelector('[name="name"]') || {}).value || '';
                              var email = (form.querySelector('#email') || form.querySelector('[type="email"]') || {}).value || '';
                                  var service = (form.querySelector('#service') || form.querySelector('[name="service"]') || {}).value || 'Not specified';
                                      var deal = (form.querySelector('#deal') || form.querySelector('textarea') || {}).value || '';

                                          btn.textContent = 'Sending…';
                                              btn.disabled = true;

                                                  try {
                                                        var res = await fetch('/api/contact', {
                                                                method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ name: name, email: email, company: service, message: deal })
                                                                                      });
                                                                                            if (res.ok) {
                                                                                                    btn.textContent = 'Sent! We\'ll be in touch.';
                                                                                                            btn.style.background = '#2d7a4f';
                                                                                                                    form.reset();
                                                                                                                            setTimeout(function () {
                                                                                                                                      var closeBtn = document.querySelector('.modal-close, [onclick*="closeModal"]');
                                                                                                                                                if (closeBtn) closeBtn.click();
                                                                                                                                                        }, 3000);
                                                                                                                                                              } else {
                                                                                                                                                                      btn.textContent = 'Error — please email matt@caprateadvisory.com';
                                                                                                                                                                              btn.disabled = false;
                                                                                                                                                                                    }
                                                                                                                                                                                        } catch (err) {
                                                                                                                                                                                              btn.textContent = 'Error — please email matt@caprateadvisory.com';
                                                                                                                                                                                                    btn.disabled = false;
                                                                                                                                                                                                        }
                                                                                                                                                                                                          });
                                                                                                                                                                                                          });
