'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface InformedConsentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function InformedConsentModal({ isOpen, onClose }: InformedConsentModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Informed Consent Form</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 text-sm text-gray-700 space-y-4">
          <p className="text-xs text-gray-400">Last updated: June 2026</p>

          <h3 className="font-bold text-gray-900 text-base">INFORMED CONSENT</h3>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">TREATMENT TO BE DONE</h4>
            <p>
              I understand and consent to have any treatment done by the dentist after the procedure, the risks &amp; benefits &amp; cost have been fully explained. These treatments include, but are not limited to, x-rays, cleanings, periodontal treatments, fillings, crowns, bridges, all types of extraction, root canals, &amp;/or dentures, local anesthetics &amp; surgical cases.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">DRUGS &amp; MEDICATIONS</h4>
            <p>
              I understand that antibiotics, analgesics &amp; other medications can cause allergic reactions like redness &amp; swelling of tissues, pain, itching, vomiting, &amp;/or anaphylactic shock.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">CHANGES IN TREATMENT PLAN</h4>
            <p>
              I understand that during treatment it may be necessary to change/add procedures because of conditions found while working on the teeth that was not discovered during examination. For example, root canal therapy may be needed following routine restorative procedures. I give my permission to the dentist to make any/all changes and additions as necessary w/ my responsibility to pay all the costs agreed.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">RADIOGRAPH</h4>
            <p>
              I understand that an x-ray shot or a radiograph maybe necessary as part of diagnostic aid to come up with tentative diagnosis of my Dental problem and to make a good treatment plan, but, this will not give me a 100% assurance for the accuracy of the treatment since all dental treatments are subject to unpredictable complications that later on may lead to sudden change of treatment plan and subject to new charges.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">REMOVAL OF TEETH</h4>
            <p>
              I understand that alternatives to tooth removal (root canal therapy, crowns &amp; periodontal surgery, etc.) &amp; I completely understand these alternatives, including their risk &amp; benefits prior to authorizing the dentist to remove teeth &amp; any other structures necessary for reasons above. I understand that removing teeth does not always remove all the infections, if present, &amp; it may be necessary to have further treatment. I understand the risk involved in having teeth removed, such as pain, swelling, spread of infection, dry socket, fractured jaw, loss of feeling on the teeth, lips, tongue &amp; surrounding tissue that can last for an indefinite period of time. I understand that I may need further treatment under a specialist if complications arise during or following treatment.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">CROWNS (CAPS) &amp; BRIDGES</h4>
            <p>
              Preparing a tooth may irritate the nerve tissue in the center of the tooth, leaving the tooth extra sensitive to heat, cold &amp; pressure. Treating such irritation may involve using special toothpastes, mouth rinses or root canal therapy. I understand that sometimes it is not possible to match the color of natural teeth exactly with artificial teeth. I further understand that I may be wearing temporary crowns, which may come off easily &amp; that I must be careful to ensure that they are kept on until the permanent crowns are delivered. It is my responsibility to return for permanent cementation within 20 days from tooth preparation, as excessive days delay may allow for tooth movement, which may necessitate a remake of the crown, bridge/cap. I understand there will be additional charges for remakes due to my delaying of permanent cementation, &amp; I realize that final opportunity to make changes in my new crown, bridges or cap (including shape, fit, size, &amp; color) will be before permanent cementation.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">ENDODONTICS (ROOT CANAL)</h4>
            <p>
              I understand there is no guarantee that a root canal treatment will save a tooth &amp; that complications can occur from the treatment &amp; that occasionally root canal filling materials may extend through the tooth which does not necessarily effect the success of the treatment. I understand that endodontic files &amp; drills are very fine instruments &amp; stresses vented in their manufacture &amp; calcifications present in teeth can cause them to break during use. I understand that referral to the endodontist for additional treatments may be necessary following any root canal treatment &amp; I agree that I am responsible for any additional cost for treatment performed by the endodontist. I understand that a tooth may require removal in spite of all efforts to save it.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">PERIODONTAL DISEASE</h4>
            <p>
              I understand that periodontal disease is a serious condition causing gum &amp; bone inflammation &amp;/or loss &amp; that can lead eventually to the loss of my teeth. I understand the alternative treatment plans to correct periodontal disease, including gum surgery tooth extractions with or without replacement. I understand that undertaking any dental procedures may have future adverse effect on my periodontal Conditions.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">FILLINGS</h4>
            <p>
              I understand that care must be exercised in chewing on fillings, especially during the first 24 hours to avoid breakage. I understand that a more extensive filling or a crown may be required, as additional decay or fracture may become evident after initial excavation. I understand that significant sensitivity is a common, but usually temporary, after-effect of a newly placed filling. I further understand that filling a tooth may irritate the nerve tissue creating sensitivity &amp; treating such sensitivity could require root canal therapy or extractions.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-gray-900 mb-2">DENTURES</h4>
            <p>
              I understand that wearing of dentures can be difficult. Sore spots, altered speech &amp; difficulty in eating are common problems. Immediate dentures (placement of denture immediately after extractions) may be painful. Immediate dentures may require considerable adjusting &amp; several relines. I understand that it is my responsibility to return for delivery of dentures. I understand that failure to keep my delivery appointment may result in poorly fitted dentures. If a remake is required due to my delays of more than 30 days, there will be additional charges. A permanent reline will be needed later, which is not included in the initial fee. I understand that all adjustment or alterations of any kind after this initial period is subject to charges.
            </p>
          </section>

          <section>
            <p className="mb-2">
              I understand that dentistry is not an exact science and that no dentist can properly guarantee accurate results all the time.
            </p>
          </section>

          <section>
            <p>
              I hereby authorize any of the doctors/dental auxiliaries to proceed with &amp; perform the dental restorations &amp; treatments as explained to me. I understand that these are subject to modification depending on undiagnosable circumstances that may arise during the course of treatment. I understand that regardless of any dental insurance coverage I may have, I am responsible for payment of dental fees, I agree to pay any attorney's fees, collection fee, or court costs that may be incurred to satisfy any obligation to this office. All treatment were properly explained to me &amp; any untoward circumstances that may arise during the procedure, the attending dentist will not be held liable since it is my free will, with full trust &amp; confidence in him/her, to undergo dental Treatment under his/her care.
            </p>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
